//! JSON Web Token decoding (header + payload + signature) and HMAC verification.

use crate::error::{ToolError, ToolResult};
use base64::engine::general_purpose::URL_SAFE_NO_PAD;
use base64::Engine;
use hmac::digest::KeyInit;
use hmac::{Hmac, Mac};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use sha2::{Sha256, Sha384, Sha512};

#[derive(Debug, Serialize, PartialEq, Eq)]
pub struct DecodedJwt {
    /// Pretty-printed JSON header.
    pub header: String,
    /// Pretty-printed JSON payload.
    pub payload: String,
    /// Raw signature segment (base64url), left undecoded.
    pub signature: String,
}

#[derive(Debug, Serialize, PartialEq, Eq)]
pub struct Verification {
    /// Whether the signature is valid for the given secret.
    pub valid: bool,
    /// The `alg` declared in the token header.
    pub algorithm: String,
    /// Why verification failed (absent when valid).
    pub reason: Option<String>,
}

/// Verify a JWT's signature against `secret` for the HMAC algorithms
/// (HS256/HS384/HS512). Asymmetric algorithms are reported as unsupported.
pub fn verify(token: &str, secret: &str) -> ToolResult<Verification> {
    let parts: Vec<&str> = token.trim().split('.').collect();
    if parts.len() != 3 {
        return Err(ToolError::invalid_input(
            "a JWT must have three dot-separated parts",
        ));
    }
    let header_json = crate::base64::decode(parts[0])?;
    let header: Value = serde_json::from_str(&header_json)
        .map_err(|e| ToolError::invalid_input(format!("header is not valid JSON: {e}")))?;
    let algorithm = header
        .get("alg")
        .and_then(Value::as_str)
        .unwrap_or("")
        .to_string();

    let signing_input = format!("{}.{}", parts[0], parts[1]);
    let key = secret.as_bytes();

    // base64url(no-pad) HMAC of the signing input with the given hash.
    macro_rules! sign {
        ($hash:ty) => {{
            let mut mac = <Hmac<$hash>>::new_from_slice(key)
                .expect("HMAC accepts keys of any length");
            Mac::update(&mut mac, signing_input.as_bytes());
            URL_SAFE_NO_PAD.encode(mac.finalize().into_bytes())
        }};
    }

    let computed = match algorithm.as_str() {
        "HS256" => sign!(Sha256),
        "HS384" => sign!(Sha384),
        "HS512" => sign!(Sha512),
        other => {
            return Ok(Verification {
                valid: false,
                algorithm: other.to_string(),
                reason: Some(format!(
                    "verification for {other} is not supported (only HS256/HS384/HS512)"
                )),
            });
        }
    };

    let valid = computed == parts[2];
    Ok(Verification {
        valid,
        algorithm,
        reason: (!valid).then(|| "signature does not match the secret".to_string()),
    })
}

/// Decode a JWT into its three parts. Returns [`ToolError::InvalidInput`] when
/// the token is malformed or its header/payload are not valid JSON.
pub fn decode(token: &str) -> ToolResult<DecodedJwt> {
    let parts: Vec<&str> = token.trim().split('.').collect();
    if parts.len() != 3 {
        return Err(ToolError::invalid_input(
            "a JWT must have three dot-separated parts",
        ));
    }
    Ok(DecodedJwt {
        header: decode_segment(parts[0])?,
        payload: decode_segment(parts[1])?,
        signature: parts[2].to_string(),
    })
}

/// Base64url-decode a segment and pretty-print it as JSON.
fn decode_segment(segment: &str) -> ToolResult<String> {
    let json = crate::base64::decode(segment)?;
    let value: Value = serde_json::from_str(&json)
        .map_err(|e| ToolError::invalid_input(format!("segment is not valid JSON: {e}")))?;
    serde_json::to_string_pretty(&value).map_err(|e| ToolError::other(e.to_string()))
}

#[derive(Deserialize)]
struct DecodeParams {
    token: String,
}

#[derive(Deserialize)]
struct VerifyParams {
    token: String,
    secret: String,
}

pub fn dispatch(action: &str, params: Value) -> ToolResult<Value> {
    match action {
        "jwt.decode" => {
            let p: DecodeParams = serde_json::from_value(params)
                .map_err(|e| ToolError::invalid_input(e.to_string()))?;
            serde_json::to_value(decode(&p.token)?).map_err(|e| ToolError::other(e.to_string()))
        }
        "jwt.verify" => {
            let p: VerifyParams = serde_json::from_value(params)
                .map_err(|e| ToolError::invalid_input(e.to_string()))?;
            serde_json::to_value(verify(&p.token, &p.secret)?)
                .map_err(|e| ToolError::other(e.to_string()))
        }
        _ => Err(ToolError::invalid_input(format!("unknown action: {action}"))),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    // Standard jwt.io example token.
    const TOKEN: &str = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";

    #[test]
    fn decodes_header() {
        let decoded = decode(TOKEN).unwrap();
        assert!(decoded.header.contains("HS256"));
        assert!(decoded.header.contains("JWT"));
    }

    #[test]
    fn decodes_payload() {
        let decoded = decode(TOKEN).unwrap();
        assert!(decoded.payload.contains("John Doe"));
        assert!(decoded.payload.contains("1516239022"));
    }

    #[test]
    fn keeps_raw_signature() {
        let decoded = decode(TOKEN).unwrap();
        assert_eq!(
            decoded.signature,
            "SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"
        );
    }

    #[test]
    fn rejects_wrong_part_count() {
        assert!(matches!(decode("a.b"), Err(ToolError::InvalidInput(_))));
    }

    #[test]
    fn rejects_non_json_segments() {
        assert!(matches!(
            decode("bm90anNvbg.bm90anNvbg.sig"),
            Err(ToolError::InvalidInput(_))
        ));
    }

    #[test]
    fn verifies_hs256_with_correct_secret() {
        let result = verify(TOKEN, "your-256-bit-secret").unwrap();
        assert!(result.valid);
        assert_eq!(result.algorithm, "HS256");
        assert!(result.reason.is_none());
    }

    #[test]
    fn rejects_hs256_with_wrong_secret() {
        let result = verify(TOKEN, "nope").unwrap();
        assert!(!result.valid);
        assert!(result.reason.is_some());
    }

    #[test]
    fn reports_unsupported_algorithm() {
        // RS256 header, dummy payload/signature.
        let token = "eyJhbGciOiJSUzI1NiJ9.eyJhIjoxfQ.sig";
        let result = verify(token, "secret").unwrap();
        assert!(!result.valid);
        assert_eq!(result.algorithm, "RS256");
        assert!(result.reason.as_deref().unwrap().contains("RS256"));
    }

    #[test]
    fn verify_rejects_malformed_token() {
        assert!(matches!(
            verify("a.b", "secret"),
            Err(ToolError::InvalidInput(_))
        ));
    }
}
