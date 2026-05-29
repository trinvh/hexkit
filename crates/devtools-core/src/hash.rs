//! Cryptographic hash digests (MD5, SHA-1, SHA-256, SHA-512).

use crate::error::{ToolError, ToolResult};
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

#[derive(Deserialize)]
struct OneInput {
    input: String,
}

pub fn dispatch(action: &str, params: Value) -> ToolResult<Value> {
    let parsed: OneInput =
        serde_json::from_value(params).map_err(|e| ToolError::invalid_input(e.to_string()))?;
    match action {
        "hash.generate" => {
            serde_json::to_value(hash(&parsed.input)).map_err(|e| ToolError::other(e.to_string()))
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
}
