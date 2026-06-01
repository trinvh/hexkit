//! OpenPGP: keygen + encrypt/decrypt + sign/verify (incl. combined ops).
//!
//! Built on the pure-Rust [`pgp`] crate (rpgp). Keys default to
//! Ed25519 (signing/cert) + Curve25519 ECDH (encryption), serialized as
//! ASCII-armored RFC 4880 v4 blocks for maximum interop with GnuPG and
//! older clients. Pass an empty passphrase to leave the key unprotected.

use crate::error::{ToolError, ToolResult};
use pgp::composed::{
    ArmorOptions, Deserializable, DetachedSignature, EncryptionCaps, KeyType, Message,
    MessageBuilder, SecretKeyParamsBuilder, SignedPublicKey, SignedPublicSubKey, SignedSecretKey,
    SignedSecretSubKey, SubkeyParamsBuilder,
};
use pgp::crypto::ecc_curve::ECCCurve;
use pgp::crypto::hash::HashAlgorithm;
use pgp::crypto::sym::SymmetricKeyAlgorithm;
use pgp::types::{KeyDetails, Password, SigningKey};
// pgp 0.19 still consumes rand 0.8 internally; alias it so we hand it
// a compatible ThreadRng instead of the workspace's rand 0.10.
use rand_v08::thread_rng as rng;
use serde::{Deserialize, Serialize};
use serde_json::Value;

// ---------------------------------------------------------------------------
// Result types
// ---------------------------------------------------------------------------

#[derive(Debug, Serialize)]
pub struct Keypair {
    /// ASCII-armored private key block.
    pub private_key: String,
    /// ASCII-armored public key block.
    pub public_key: String,
    /// Hex fingerprint of the primary key.
    pub fingerprint: String,
}

#[derive(Debug, Serialize)]
pub struct DecryptedMessage {
    pub plaintext: String,
}

#[derive(Debug, Serialize)]
pub struct Verification {
    pub valid: bool,
    pub signer_fingerprint: Option<String>,
    pub reason: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct DecryptedAndVerified {
    pub plaintext: String,
    pub verification: Verification,
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

fn map_err<E: std::fmt::Display>(e: E) -> ToolError {
    ToolError::other(e.to_string())
}

fn invalid<E: std::fmt::Display>(e: E) -> ToolError {
    ToolError::invalid_input(e.to_string())
}

fn parse_secret_key(armored: &str) -> ToolResult<SignedSecretKey> {
    let (key, _) = SignedSecretKey::from_string(armored).map_err(invalid)?;
    Ok(key)
}

fn parse_public_key(armored: &str) -> ToolResult<SignedPublicKey> {
    let (key, _) = SignedPublicKey::from_string(armored).map_err(invalid)?;
    Ok(key)
}

fn pass(passphrase: &str) -> Password {
    if passphrase.is_empty() {
        Password::empty()
    } else {
        Password::from(passphrase.to_string())
    }
}

fn is_encryption_subkey(sk: &SignedPublicSubKey) -> bool {
    sk.signatures
        .iter()
        .any(|sig| sig.key_flags().encrypt_comms() || sig.key_flags().encrypt_storage())
}

fn is_signing_subkey_pub(sk: &SignedPublicSubKey) -> bool {
    sk.signatures.iter().any(|sig| sig.key_flags().sign())
}

fn is_signing_subkey_sec(sk: &SignedSecretSubKey) -> bool {
    sk.signatures.iter().any(|sig| sig.key_flags().sign())
}

/// Pick the best signing key in a secret cert — a signing subkey if present,
/// else the primary. Both packet types implement [`SigningKey`].
fn signing_key_of(secret: &SignedSecretKey) -> &dyn SigningKey {
    if let Some(sub) = secret.secret_subkeys.iter().find(|sk| is_signing_subkey_sec(sk)) {
        &sub.key
    } else {
        &secret.primary_key
    }
}

// ---------------------------------------------------------------------------
// Public ops
// ---------------------------------------------------------------------------

/// Generate a fresh Ed25519 / Curve25519 keypair.
///
/// The primary key certifies; a signing subkey signs; an encryption subkey
/// encrypts. The `passphrase` may be empty for an unprotected key.
pub fn keygen(user_id: &str, passphrase: &str) -> ToolResult<Keypair> {
    if user_id.trim().is_empty() {
        return Err(ToolError::invalid_input("user id must not be empty"));
    }

    let mut sign_subkey = SubkeyParamsBuilder::default();
    sign_subkey
        .key_type(KeyType::Ed25519Legacy)
        .can_sign(true)
        .can_encrypt(EncryptionCaps::None)
        .can_authenticate(false);

    let mut encrypt_subkey = SubkeyParamsBuilder::default();
    encrypt_subkey
        .key_type(KeyType::ECDH(ECCCurve::Curve25519))
        .can_sign(false)
        .can_encrypt(EncryptionCaps::Communication)
        .can_authenticate(false);

    let mut params = SecretKeyParamsBuilder::default();
    params
        .key_type(KeyType::Ed25519Legacy)
        .can_certify(true)
        .can_sign(false)
        .can_encrypt(EncryptionCaps::None)
        .primary_user_id(user_id.to_string())
        .subkeys(vec![
            sign_subkey.build().map_err(map_err)?,
            encrypt_subkey.build().map_err(map_err)?,
        ]);

    if !passphrase.is_empty() {
        params.passphrase(Some(passphrase.to_string()));
    }

    let secret_params = params.build().map_err(map_err)?;
    let signed_secret = secret_params.generate(rng()).map_err(map_err)?;
    let signed_public = signed_secret.to_public_key();

    Ok(Keypair {
        private_key: signed_secret
            .to_armored_string(ArmorOptions::default())
            .map_err(map_err)?,
        public_key: signed_public
            .to_armored_string(ArmorOptions::default())
            .map_err(map_err)?,
        fingerprint: signed_secret.fingerprint().to_string(),
    })
}

/// Encrypt `plaintext` to one recipient public key. Returns ASCII-armored
/// ciphertext.
pub fn encrypt(plaintext: &str, recipient_public_key: &str) -> ToolResult<String> {
    let cert = parse_public_key(recipient_public_key)?;
    let encryption_subkey = cert
        .public_subkeys
        .iter()
        .find(|sk| is_encryption_subkey(sk))
        .ok_or_else(|| {
            ToolError::invalid_input("recipient public key has no encryption-capable subkey")
        })?;

    let mut builder = MessageBuilder::from_bytes("", plaintext.as_bytes().to_vec())
        .seipd_v1(rng(), SymmetricKeyAlgorithm::AES256);
    builder
        .encrypt_to_key(rng(), encryption_subkey)
        .map_err(map_err)?;
    builder
        .to_armored_string(rng(), ArmorOptions::default())
        .map_err(map_err)
}

/// Decrypt an ASCII-armored ciphertext with the recipient's private key.
pub fn decrypt(
    ciphertext: &str,
    private_key: &str,
    passphrase: &str,
) -> ToolResult<DecryptedMessage> {
    let secret = parse_secret_key(private_key)?;
    let (message, _) = Message::from_string(ciphertext).map_err(invalid)?;

    let mut decrypted = message.decrypt(&pass(passphrase), &secret).map_err(map_err)?;
    let plaintext = decrypted.as_data_string().map_err(map_err)?;
    Ok(DecryptedMessage { plaintext })
}

/// Create a detached ASCII-armored signature over `data` using the signing
/// subkey of `private_key`.
pub fn sign(data: &str, private_key: &str, passphrase: &str) -> ToolResult<String> {
    let secret = parse_secret_key(private_key)?;

    // `sign_text_data` needs `&impl SigningKey` (must be Sized), so the
    // subkey-vs-primary choice has to happen inline at each call site.
    let sig = if let Some(sub) = secret.secret_subkeys.iter().find(|sk| is_signing_subkey_sec(sk))
    {
        DetachedSignature::sign_text_data(
            rng(),
            &sub.key,
            &pass(passphrase),
            HashAlgorithm::Sha256,
            data.as_bytes(),
        )
    } else {
        DetachedSignature::sign_text_data(
            rng(),
            &secret.primary_key,
            &pass(passphrase),
            HashAlgorithm::Sha256,
            data.as_bytes(),
        )
    }
    .map_err(map_err)?;
    sig.to_armored_string(ArmorOptions::default()).map_err(map_err)
}

/// Verify a detached ASCII-armored signature against `data` using `public_key`.
pub fn verify(data: &str, signature: &str, public_key: &str) -> ToolResult<Verification> {
    let cert = parse_public_key(public_key)?;
    let (sig, _) = DetachedSignature::from_string(signature).map_err(invalid)?;

    // Try the signing subkey first, then fall back to the primary key.
    let primary_fp = cert.fingerprint().to_string();
    let result = if let Some(sub) = cert.public_subkeys.iter().find(|sk| is_signing_subkey_pub(sk))
    {
        sig.verify(&sub.key, data.as_bytes())
    } else {
        sig.verify(&cert.primary_key, data.as_bytes())
    };

    match result {
        Ok(_) => Ok(Verification {
            valid: true,
            signer_fingerprint: Some(primary_fp),
            reason: None,
        }),
        Err(e) => Ok(Verification {
            valid: false,
            signer_fingerprint: Some(primary_fp),
            reason: Some(e.to_string()),
        }),
    }
}

/// Encrypt-then-sign in one pass — produces an inline-signed, encrypted
/// ASCII-armored message that `decrypt_verify` can both decrypt and check.
pub fn encrypt_and_sign(
    plaintext: &str,
    recipient_public_key: &str,
    sender_private_key: &str,
    sender_passphrase: &str,
) -> ToolResult<String> {
    let cert = parse_public_key(recipient_public_key)?;
    let secret = parse_secret_key(sender_private_key)?;

    let encryption_subkey = cert
        .public_subkeys
        .iter()
        .find(|sk| is_encryption_subkey(sk))
        .ok_or_else(|| {
            ToolError::invalid_input("recipient public key has no encryption-capable subkey")
        })?;
    let signing_key = signing_key_of(&secret);

    let mut builder = MessageBuilder::from_bytes("", plaintext.as_bytes().to_vec())
        .seipd_v1(rng(), SymmetricKeyAlgorithm::AES256);
    builder
        .sign(signing_key, pass(sender_passphrase), HashAlgorithm::Sha256)
        .encrypt_to_key(rng(), encryption_subkey)
        .map_err(map_err)?;
    builder
        .to_armored_string(rng(), ArmorOptions::default())
        .map_err(map_err)
}

/// Decrypt an inline-signed, encrypted ASCII-armored message and verify the
/// embedded signature against `sender_public_key`.
pub fn decrypt_and_verify(
    ciphertext: &str,
    recipient_private_key: &str,
    recipient_passphrase: &str,
    sender_public_key: &str,
) -> ToolResult<DecryptedAndVerified> {
    let secret = parse_secret_key(recipient_private_key)?;
    let sender_cert = parse_public_key(sender_public_key)?;
    let (message, _) = Message::from_string(ciphertext).map_err(invalid)?;

    let mut decrypted = message
        .decrypt(&pass(recipient_passphrase), &secret)
        .map_err(map_err)?;
    let plaintext = decrypted.as_data_string().map_err(map_err)?;

    let fp = sender_cert.fingerprint().to_string();
    // Try signing subkey first, then primary.
    let verify_result = if let Some(sub) = sender_cert
        .public_subkeys
        .iter()
        .find(|sk| is_signing_subkey_pub(sk))
    {
        decrypted.verify(&sub.key)
    } else {
        decrypted.verify(&sender_cert.primary_key)
    };

    let verification = match verify_result {
        Ok(_) => Verification {
            valid: true,
            signer_fingerprint: Some(fp),
            reason: None,
        },
        Err(e) => Verification {
            valid: false,
            signer_fingerprint: Some(fp),
            reason: Some(e.to_string()),
        },
    };

    Ok(DecryptedAndVerified {
        plaintext,
        verification,
    })
}

// ---------------------------------------------------------------------------
// Dispatcher
// ---------------------------------------------------------------------------

#[derive(Deserialize)]
struct KeygenParams {
    user_id: String,
    #[serde(default)]
    passphrase: String,
}

#[derive(Deserialize)]
struct EncryptParams {
    input: String,
    public_key: String,
}

#[derive(Deserialize)]
struct DecryptParams {
    input: String,
    private_key: String,
    #[serde(default)]
    passphrase: String,
}

#[derive(Deserialize)]
struct SignParams {
    input: String,
    private_key: String,
    #[serde(default)]
    passphrase: String,
}

#[derive(Deserialize)]
struct VerifyParams {
    input: String,
    signature: String,
    public_key: String,
}

#[derive(Deserialize)]
struct EncryptSignParams {
    input: String,
    public_key: String,
    private_key: String,
    #[serde(default)]
    passphrase: String,
}

#[derive(Deserialize)]
struct DecryptVerifyParams {
    input: String,
    private_key: String,
    #[serde(default)]
    passphrase: String,
    public_key: String,
}

pub fn dispatch(action: &str, params: Value) -> ToolResult<Value> {
    match action {
        "pgp.keygen" => {
            let p: KeygenParams = serde_json::from_value(params).map_err(invalid)?;
            serde_json::to_value(keygen(&p.user_id, &p.passphrase)?).map_err(map_err)
        }
        "pgp.encrypt" => {
            let p: EncryptParams = serde_json::from_value(params).map_err(invalid)?;
            serde_json::to_value(encrypt(&p.input, &p.public_key)?).map_err(map_err)
        }
        "pgp.decrypt" => {
            let p: DecryptParams = serde_json::from_value(params).map_err(invalid)?;
            serde_json::to_value(decrypt(&p.input, &p.private_key, &p.passphrase)?)
                .map_err(map_err)
        }
        "pgp.sign" => {
            let p: SignParams = serde_json::from_value(params).map_err(invalid)?;
            serde_json::to_value(sign(&p.input, &p.private_key, &p.passphrase)?).map_err(map_err)
        }
        "pgp.verify" => {
            let p: VerifyParams = serde_json::from_value(params).map_err(invalid)?;
            serde_json::to_value(verify(&p.input, &p.signature, &p.public_key)?).map_err(map_err)
        }
        "pgp.encrypt_sign" => {
            let p: EncryptSignParams = serde_json::from_value(params).map_err(invalid)?;
            serde_json::to_value(encrypt_and_sign(
                &p.input,
                &p.public_key,
                &p.private_key,
                &p.passphrase,
            )?)
            .map_err(map_err)
        }
        "pgp.decrypt_verify" => {
            let p: DecryptVerifyParams = serde_json::from_value(params).map_err(invalid)?;
            serde_json::to_value(decrypt_and_verify(
                &p.input,
                &p.private_key,
                &p.passphrase,
                &p.public_key,
            )?)
            .map_err(map_err)
        }
        _ => Err(ToolError::invalid_input(format!("unknown action: {action}"))),
    }
}

// ---------------------------------------------------------------------------
// Tests — roundtrips against generated keys.
// ---------------------------------------------------------------------------

#[cfg(test)]
mod tests {
    use super::*;

    fn keypair() -> Keypair {
        keygen("Alice <alice@hexkit.app>", "").unwrap()
    }

    #[test]
    fn keygen_produces_armored_blocks_and_fingerprint() {
        let kp = keypair();
        assert!(kp.private_key.contains("BEGIN PGP PRIVATE KEY BLOCK"));
        assert!(kp.public_key.contains("BEGIN PGP PUBLIC KEY BLOCK"));
        assert_eq!(kp.fingerprint.len(), 40, "v4 Ed25519 fingerprint is 20 bytes / 40 hex chars");
    }

    #[test]
    fn keygen_rejects_empty_user_id() {
        assert!(matches!(
            keygen("   ", ""),
            Err(ToolError::InvalidInput(_))
        ));
    }

    #[test]
    fn keygen_supports_passphrase_protected_keys() {
        let kp = keygen("Bob <bob@hexkit.app>", "correct horse battery staple").unwrap();
        assert!(kp.private_key.contains("BEGIN PGP PRIVATE KEY BLOCK"));
    }

    #[test]
    fn encrypt_then_decrypt_roundtrip() {
        let kp = keypair();
        let plaintext = "the only winning move is not to play";
        let ciphertext = encrypt(plaintext, &kp.public_key).unwrap();
        assert!(ciphertext.contains("BEGIN PGP MESSAGE"));
        let decrypted = decrypt(&ciphertext, &kp.private_key, "").unwrap();
        assert_eq!(decrypted.plaintext, plaintext);
    }

    #[test]
    fn encrypt_then_decrypt_with_passphrase() {
        let kp = keygen("Eve <eve@hexkit.app>", "swordfish").unwrap();
        let ciphertext = encrypt("secret memo", &kp.public_key).unwrap();
        let decrypted = decrypt(&ciphertext, &kp.private_key, "swordfish").unwrap();
        assert_eq!(decrypted.plaintext, "secret memo");
    }

    #[test]
    fn decrypt_rejects_garbage_ciphertext() {
        let kp = keypair();
        let result = decrypt("not a pgp message", &kp.private_key, "");
        assert!(result.is_err());
    }

    #[test]
    fn sign_then_verify_roundtrip() {
        let kp = keypair();
        let data = "this document is approved";
        let signature = sign(data, &kp.private_key, "").unwrap();
        assert!(signature.contains("BEGIN PGP SIGNATURE"));
        let v = verify(data, &signature, &kp.public_key).unwrap();
        assert!(v.valid, "signature should verify, got reason: {:?}", v.reason);
        assert!(v.signer_fingerprint.is_some());
    }

    #[test]
    fn verify_rejects_tampered_data() {
        let kp = keypair();
        let signature = sign("original text", &kp.private_key, "").unwrap();
        let v = verify("tampered text", &signature, &kp.public_key).unwrap();
        assert!(!v.valid);
        assert!(v.reason.is_some());
    }

    #[test]
    fn verify_rejects_signature_from_other_key() {
        let alice = keypair();
        let bob = keygen("Bob <bob@hexkit.app>", "").unwrap();
        let signature = sign("hello", &alice.private_key, "").unwrap();
        let v = verify("hello", &signature, &bob.public_key).unwrap();
        assert!(!v.valid);
    }

    #[test]
    fn encrypt_sign_then_decrypt_verify_roundtrip() {
        let alice = keypair();
        let bob = keygen("Bob <bob@hexkit.app>", "").unwrap();

        let plaintext = "rendezvous at midnight";
        let ciphertext =
            encrypt_and_sign(plaintext, &bob.public_key, &alice.private_key, "").unwrap();
        assert!(ciphertext.contains("BEGIN PGP MESSAGE"));

        let dv = decrypt_and_verify(&ciphertext, &bob.private_key, "", &alice.public_key).unwrap();
        assert_eq!(dv.plaintext, plaintext);
        assert!(dv.verification.valid, "expected valid sig, got: {:?}", dv.verification.reason);
    }

    #[test]
    fn decrypt_verify_flags_wrong_sender_key() {
        let alice = keypair();
        let bob = keygen("Bob <bob@hexkit.app>", "").unwrap();
        let mallory = keygen("Mallory <m@evil.example>", "").unwrap();

        let ciphertext =
            encrypt_and_sign("plans", &bob.public_key, &alice.private_key, "").unwrap();

        // Decrypts fine (encrypted to bob), but signature is from alice not mallory.
        let dv =
            decrypt_and_verify(&ciphertext, &bob.private_key, "", &mallory.public_key).unwrap();
        assert_eq!(dv.plaintext, "plans");
        assert!(!dv.verification.valid);
    }

    #[test]
    fn dispatch_routes_keygen() {
        use serde_json::json;
        let v = dispatch(
            "pgp.keygen",
            json!({ "user_id": "Carol <carol@hexkit.app>", "passphrase": "" }),
        )
        .unwrap();
        assert!(v.get("public_key").and_then(Value::as_str).unwrap().contains("PUBLIC KEY"));
    }
}
