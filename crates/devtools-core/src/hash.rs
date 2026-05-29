//! Cryptographic hash digests (MD5, SHA-1, SHA-256, SHA-512) and HMAC.

use crate::error::{ToolError, ToolResult};
use hmac::digest::KeyInit;
use hmac::{Hmac, Mac};
use md5::Md5;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use sha1::Sha1;
use sha2::{Digest, Sha256, Sha512};

#[derive(Debug, Serialize, PartialEq, Eq)]
pub struct Hashes {
    pub md5: String,
    pub sha1: String,
    pub sha256: String,
    pub sha512: String,
}

/// Compute MD5, SHA-1, SHA-256, and SHA-512 hex digests of `input`.
pub fn hash(input: &str) -> Hashes {
    let bytes = input.as_bytes();
    Hashes {
        md5: hex_digest::<Md5>(bytes),
        sha1: hex_digest::<Sha1>(bytes),
        sha256: hex_digest::<Sha256>(bytes),
        sha512: hex_digest::<Sha512>(bytes),
    }
}

fn hex_digest<D: Digest>(bytes: &[u8]) -> String {
    let mut hasher = D::new();
    hasher.update(bytes);
    hasher
        .finalize()
        .iter()
        .map(|byte| format!("{byte:02x}"))
        .collect()
}

fn to_hex(bytes: &[u8]) -> String {
    bytes.iter().map(|b| format!("{b:02x}")).collect()
}

/// Compute the keyed HMAC hex digest of `message` for `algorithm`
/// (`md5`, `sha1`, `sha256`, or `sha512`).
pub fn hmac(algorithm: &str, key: &str, message: &str) -> ToolResult<String> {
    let key = key.as_bytes();

    macro_rules! mac_hex {
        ($hash:ty) => {{
            let mut mac =
                <Hmac<$hash>>::new_from_slice(key).expect("HMAC accepts keys of any length");
            Mac::update(&mut mac, message.as_bytes());
            to_hex(&mac.finalize().into_bytes())
        }};
    }

    let digest = match algorithm {
        "md5" => mac_hex!(Md5),
        "sha1" => mac_hex!(Sha1),
        "sha256" => mac_hex!(Sha256),
        "sha512" => mac_hex!(Sha512),
        other => {
            return Err(ToolError::invalid_input(format!(
                "unknown HMAC algorithm: {other}"
            )));
        }
    };
    Ok(digest)
}

#[derive(Deserialize)]
struct OneInput {
    input: String,
}

#[derive(Deserialize)]
struct HmacParams {
    algorithm: String,
    key: String,
    message: String,
}

pub fn dispatch(action: &str, params: Value) -> ToolResult<Value> {
    match action {
        "hash.generate" => {
            let p: OneInput = serde_json::from_value(params)
                .map_err(|e| ToolError::invalid_input(e.to_string()))?;
            serde_json::to_value(hash(&p.input)).map_err(|e| ToolError::other(e.to_string()))
        }
        "hash.hmac" => {
            let p: HmacParams = serde_json::from_value(params)
                .map_err(|e| ToolError::invalid_input(e.to_string()))?;
            Ok(Value::String(hmac(&p.algorithm, &p.key, &p.message)?))
        }
        _ => Err(ToolError::invalid_input(format!("unknown action: {action}"))),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn hashes_empty_string() {
        let h = hash("");
        assert_eq!(h.md5, "d41d8cd98f00b204e9800998ecf8427e");
        assert_eq!(h.sha1, "da39a3ee5e6b4b0d3255bfef95601890afd80709");
        assert_eq!(
            h.sha256,
            "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
        );
    }

    #[test]
    fn hashes_abc() {
        let h = hash("abc");
        assert_eq!(h.md5, "900150983cd24fb0d6963f7d28e17f72");
        assert_eq!(h.sha1, "a9993e364706816aba3e25717850c26c9cd0d89d");
        assert_eq!(
            h.sha256,
            "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad"
        );
        assert_eq!(
            h.sha512,
            "ddaf35a193617abacc417349ae20413112e6fa4e89a97ea20a9eeee64b55d39a2192992a274fc1a836ba3c23a3feebbd454d4423643ce80e2a9ac94fa54ca49f"
        );
    }

    #[test]
    fn produces_expected_digest_lengths() {
        let h = hash("hexkit");
        assert_eq!(h.md5.len(), 32);
        assert_eq!(h.sha1.len(), 40);
        assert_eq!(h.sha256.len(), 64);
        assert_eq!(h.sha512.len(), 128);
    }

    #[test]
    fn computes_hmac_sha256_rfc_vector() {
        // RFC 4231 test case 1: key = 20 bytes of 0x0b, data = "Hi There".
        let key = "\u{0b}".repeat(20);
        let out = hmac("sha256", &key, "Hi There").unwrap();
        assert_eq!(
            out,
            "b0344c61d8db38535ca8afceaf0bf12b881dc200c9833da726e9376c2e32cff7"
        );
    }

    #[test]
    fn computes_hmac_for_each_algorithm() {
        for algo in ["md5", "sha1", "sha256", "sha512"] {
            let out = hmac(algo, "key", "message").unwrap();
            assert!(!out.is_empty());
            assert!(out.chars().all(|c| c.is_ascii_hexdigit()));
        }
        assert_eq!(hmac("sha256", "k", "m").unwrap().len(), 64);
        assert_eq!(hmac("sha512", "k", "m").unwrap().len(), 128);
    }

    #[test]
    fn hmac_rejects_unknown_algorithm() {
        assert!(matches!(
            hmac("sha3", "k", "m"),
            Err(ToolError::InvalidInput(_))
        ));
    }
}
