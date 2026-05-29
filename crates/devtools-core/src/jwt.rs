//! JSON Web Token decoding (header + payload + signature). No verification.

use crate::error::{ToolError, ToolResult};
use serde::{Deserialize, Serialize};
use serde_json::Value;

#[derive(Debug, Serialize, PartialEq, Eq)]
pub struct DecodedJwt {
    /// Pretty-printed JSON header.
    pub header: String,
    /// Pretty-printed JSON payload.
    pub payload: String,
    /// Raw signature segment (base64url), left undecoded.
    pub signature: String,
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

pub fn dispatch(action: &str, params: Value) -> ToolResult<Value> {
    let parsed: DecodeParams =
        serde_json::from_value(params).map_err(|e| ToolError::invalid_input(e.to_string()))?;
    match action {
        "jwt.decode" => {
            serde_json::to_value(decode(&parsed.token)?).map_err(|e| ToolError::other(e.to_string()))
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
}
