//! Password-based symmetric encryption with AES-256-GCM.
//!
//! The key is derived from the password with PBKDF2-HMAC-SHA256. Each message
//! gets a fresh random salt and nonce; the output is
//! `base64(salt[16] || nonce[12] || ciphertext)` so a single string carries
//! everything decryption needs except the password.

use crate::error::{ToolError, ToolResult};
use aes_gcm::aead::Aead;
use aes_gcm::{Aes256Gcm, Key, KeyInit, Nonce};
use hmac::{Hmac, Mac};
use rand::RngExt;
use serde::Deserialize;
use serde_json::Value;
// `::base64` is the external crate; encode/decode raw bytes here (the
// `crate::base64` module is UTF-8-string only).
use ::base64::engine::general_purpose::STANDARD;
use ::base64::Engine as _;

const SALT_LEN: usize = 16;
const NONCE_LEN: usize = 12;
const KEY_LEN: usize = 32;
const PBKDF2_ROUNDS: u32 = 200_000;

/// Derive the 32-byte AES key from `password` and `salt` with
/// PBKDF2-HMAC-SHA256. Hand-rolled on the workspace's `hmac`/`sha2` (rather than
/// the `pbkdf2` crate, which pins an older `digest` version): the key length
/// equals the SHA-256 output, so a single PBKDF2 block suffices.
fn derive_key(password: &str, salt: &[u8]) -> [u8; KEY_LEN] {
    type HmacSha256 = Hmac<sha2::Sha256>;
    // Fully-qualify KeyInit: `aes_gcm` re-exports an older crypto-common KeyInit
    // that would otherwise shadow the one `hmac` implements.
    let hmac = |data: &[u8], extra: Option<&[u8]>| {
        let mut mac = <HmacSha256 as hmac::digest::KeyInit>::new_from_slice(password.as_bytes())
            .expect("HMAC accepts a key of any length");
        Mac::update(&mut mac, data);
        if let Some(extra) = extra {
            Mac::update(&mut mac, extra);
        }
        mac.finalize().into_bytes()
    };

    // U1 = PRF(password, salt || INT_BE(1)); T = U1 ^ U2 ^ … ^ U_rounds.
    let mut u = hmac(salt, Some(&1u32.to_be_bytes()));
    let mut acc = u;
    for _ in 1..PBKDF2_ROUNDS {
        u = hmac(&u, None);
        for (a, b) in acc.iter_mut().zip(u.iter()) {
            *a ^= *b;
        }
    }
    let mut key = [0u8; KEY_LEN];
    key.copy_from_slice(&acc);
    key
}

/// Encrypt `plaintext` under `password`, returning
/// `base64(salt[16] || nonce[12] || ciphertext)`.
pub fn encrypt(plaintext: &str, password: &str) -> ToolResult<String> {
    if password.is_empty() {
        return Err(ToolError::invalid_input("password is empty"));
    }

    let mut rng = rand::rng();
    let mut salt = [0u8; SALT_LEN];
    let mut nonce = [0u8; NONCE_LEN];
    rng.fill(&mut salt);
    rng.fill(&mut nonce);

    let key = derive_key(password, &salt);
    let cipher = Aes256Gcm::new(Key::<Aes256Gcm>::from_slice(&key));
    let ciphertext = cipher
        .encrypt(Nonce::from_slice(&nonce), plaintext.as_bytes())
        .map_err(|_| ToolError::other("encryption failed"))?;

    let mut packed = Vec::with_capacity(SALT_LEN + NONCE_LEN + ciphertext.len());
    packed.extend_from_slice(&salt);
    packed.extend_from_slice(&nonce);
    packed.extend_from_slice(&ciphertext);
    Ok(STANDARD.encode(&packed))
}

/// Decrypt a `base64(salt[16] || nonce[12] || ciphertext)` string under
/// `password`. Returns [`ToolError::InvalidInput`] for malformed input or a
/// wrong password / tampered ciphertext (GCM authentication failure).
pub fn decrypt(input: &str, password: &str) -> ToolResult<String> {
    if password.is_empty() {
        return Err(ToolError::invalid_input("password is empty"));
    }

    let packed = STANDARD
        .decode(input.trim().as_bytes())
        .map_err(|e| ToolError::invalid_input(e.to_string()))?;
    if packed.len() < SALT_LEN + NONCE_LEN {
        return Err(ToolError::invalid_input("input is too short"));
    }
    let (salt, rest) = packed.split_at(SALT_LEN);
    let (nonce, ciphertext) = rest.split_at(NONCE_LEN);

    let key = derive_key(password, salt);
    let cipher = Aes256Gcm::new(Key::<Aes256Gcm>::from_slice(&key));
    let plaintext = cipher
        .decrypt(Nonce::from_slice(nonce), ciphertext)
        .map_err(|_| ToolError::invalid_input("wrong password or tampered data"))?;
    String::from_utf8(plaintext)
        .map_err(|_| ToolError::invalid_input("decrypted bytes are not valid UTF-8"))
}

#[derive(Deserialize)]
struct EncryptParams {
    plaintext: String,
    password: String,
}

#[derive(Deserialize)]
struct DecryptParams {
    input: String,
    password: String,
}

pub fn dispatch(action: &str, params: Value) -> ToolResult<Value> {
    match action {
        "aes.encrypt" => {
            let p: EncryptParams = serde_json::from_value(params)
                .map_err(|e| ToolError::invalid_input(e.to_string()))?;
            Ok(Value::String(encrypt(&p.plaintext, &p.password)?))
        }
        "aes.decrypt" => {
            let p: DecryptParams = serde_json::from_value(params)
                .map_err(|e| ToolError::invalid_input(e.to_string()))?;
            Ok(Value::String(decrypt(&p.input, &p.password)?))
        }
        _ => Err(ToolError::invalid_input(format!("unknown action: {action}"))),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn round_trips_plaintext() {
        let cipher = encrypt("hello, hexkit", "correct horse battery staple").unwrap();
        let plain = decrypt(&cipher, "correct horse battery staple").unwrap();
        assert_eq!(plain, "hello, hexkit");
    }

    #[test]
    fn round_trips_unicode() {
        let cipher = encrypt("héllo 🦊 世界", "passphrase").unwrap();
        assert_eq!(decrypt(&cipher, "passphrase").unwrap(), "héllo 🦊 世界");
    }

    #[test]
    fn round_trips_empty_plaintext() {
        let cipher = encrypt("", "pw").unwrap();
        assert_eq!(decrypt(&cipher, "pw").unwrap(), "");
    }

    #[test]
    fn output_is_nondeterministic() {
        // Fresh salt + nonce per call, so the same input encrypts differently.
        let a = encrypt("same", "pw").unwrap();
        let b = encrypt("same", "pw").unwrap();
        assert_ne!(a, b);
    }

    #[test]
    fn wrong_password_fails() {
        let cipher = encrypt("secret", "right").unwrap();
        assert!(matches!(
            decrypt(&cipher, "wrong"),
            Err(ToolError::InvalidInput(_))
        ));
    }

    #[test]
    fn tampered_ciphertext_fails() {
        let cipher = encrypt("secret", "pw").unwrap();
        // Flip a byte in the packed payload and re-encode.
        let mut bytes = STANDARD.decode(cipher.as_bytes()).unwrap();
        let last = bytes.len() - 1;
        bytes[last] ^= 0x01;
        let tampered = STANDARD.encode(&bytes);
        assert!(matches!(
            decrypt(&tampered, "pw"),
            Err(ToolError::InvalidInput(_))
        ));
    }

    #[test]
    fn rejects_invalid_base64() {
        assert!(matches!(
            decrypt("@@@not base64@@@", "pw"),
            Err(ToolError::InvalidInput(_))
        ));
    }

    #[test]
    fn rejects_too_short_input() {
        // Valid base64 but fewer than salt + nonce bytes.
        let short = STANDARD.encode([0u8; 8]);
        assert!(matches!(
            decrypt(&short, "pw"),
            Err(ToolError::InvalidInput(_))
        ));
    }

    #[test]
    fn encrypt_rejects_empty_password() {
        assert!(matches!(
            encrypt("data", ""),
            Err(ToolError::InvalidInput(_))
        ));
    }

    #[test]
    fn decrypt_rejects_empty_password() {
        let cipher = encrypt("data", "pw").unwrap();
        assert!(matches!(
            decrypt(&cipher, ""),
            Err(ToolError::InvalidInput(_))
        ));
    }
}
