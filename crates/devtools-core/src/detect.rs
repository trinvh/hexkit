//! Smart detection: guess the right tool for an arbitrary string (e.g. the
//! clipboard contents).

use crate::error::{ToolError, ToolResult};
use serde::{Deserialize, Serialize};
use serde_json::Value;

#[derive(Debug, Serialize, PartialEq, Eq)]
pub struct Detection {
    /// Neutral tool kind: json, base64, jwt, url, uuid, unix_time.
    pub kind: String,
    /// Optional initial mode hint (e.g. base64 -> "decode").
    pub mode: Option<String>,
}

/// Detect the most likely tool for `input`, or `None` if nothing fits.
/// Checks are ordered most-specific first.
pub fn detect(input: &str) -> Option<Detection> {
    let trimmed = input.trim();
    if trimmed.is_empty() {
        return None;
    }
    if is_jwt(trimmed) {
        return Some(Detection { kind: "jwt".into(), mode: None });
    }
    if is_json(trimmed) {
        return Some(Detection { kind: "json".into(), mode: None });
    }
    if is_url(trimmed) {
        return Some(Detection { kind: "url".into(), mode: None });
    }
    if is_uuid_or_ulid(trimmed) {
        return Some(Detection { kind: "uuid".into(), mode: None });
    }
    if is_unix_time(trimmed) {
        return Some(Detection { kind: "unix_time".into(), mode: None });
    }
    if is_base64(trimmed) {
        return Some(Detection {
            kind: "base64".into(),
            mode: Some("decode".into()),
        });
    }
    None
}

fn is_jwt(s: &str) -> bool {
    let parts: Vec<&str> = s.split('.').collect();
    if parts.len() != 3 || parts.iter().any(|part| part.is_empty()) {
        return false;
    }
    match crate::base64::decode(parts[0]) {
        Ok(json) => serde_json::from_str::<Value>(&json)
            .map(|value| value.get("alg").is_some())
            .unwrap_or(false),
        Err(_) => false,
    }
}

fn is_json(s: &str) -> bool {
    (s.starts_with('{') || s.starts_with('[')) && serde_json::from_str::<Value>(s).is_ok()
}

fn is_url(s: &str) -> bool {
    match ::url::Url::parse(s) {
        Ok(url) => {
            matches!(url.scheme(), "http" | "https" | "ftp" | "ws" | "wss") && url.host().is_some()
        }
        Err(_) => false,
    }
}

fn is_uuid_or_ulid(s: &str) -> bool {
    uuid::Uuid::parse_str(s).is_ok() || ulid::Ulid::from_string(s).is_ok()
}

fn is_unix_time(s: &str) -> bool {
    (9..=13).contains(&s.len()) && s.bytes().all(|b| b.is_ascii_digit())
}

fn is_base64(s: &str) -> bool {
    if s.len() < 8 {
        return false;
    }
    let charset_ok = s
        .bytes()
        .all(|b| b.is_ascii_alphanumeric() || matches!(b, b'+' | b'/' | b'=' | b'-' | b'_'));
    if !charset_ok {
        return false;
    }
    if !s.contains('=') && !s.len().is_multiple_of(4) {
        return false;
    }
    crate::base64::decode(s).is_ok()
}

#[derive(Deserialize)]
struct OneInput {
    input: String,
}

pub fn dispatch(action: &str, params: Value) -> ToolResult<Value> {
    let parsed: OneInput =
        serde_json::from_value(params).map_err(|e| ToolError::invalid_input(e.to_string()))?;
    match action {
        "detect.run" => {
            serde_json::to_value(detect(&parsed.input)).map_err(|e| ToolError::other(e.to_string()))
        }
        _ => Err(ToolError::invalid_input(format!("unknown action: {action}"))),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn kind(input: &str) -> Option<String> {
        detect(input).map(|d| d.kind)
    }

    #[test]
    fn detects_unix_timestamp() {
        assert_eq!(kind("1611241901").as_deref(), Some("unix_time"));
        assert_eq!(kind("1611241901000").as_deref(), Some("unix_time"));
    }

    #[test]
    fn detects_json() {
        assert_eq!(kind(r#"{"abc": 123}"#).as_deref(), Some("json"));
        assert_eq!(kind("[1, 2, 3]").as_deref(), Some("json"));
    }

    #[test]
    fn detects_base64_with_decode_mode() {
        let detection = detect("aGVsbG8gd29ybGQ=").unwrap();
        assert_eq!(detection.kind, "base64");
        assert_eq!(detection.mode.as_deref(), Some("decode"));
    }

    #[test]
    fn detects_url() {
        assert_eq!(kind("https://example.com/path?x=1").as_deref(), Some("url"));
    }

    #[test]
    fn detects_jwt() {
        let token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";
        assert_eq!(kind(token).as_deref(), Some("jwt"));
    }

    #[test]
    fn detects_uuid() {
        assert_eq!(
            kind("550e8400-e29b-41d4-a716-446655440000").as_deref(),
            Some("uuid")
        );
    }

    #[test]
    fn ignores_plain_text() {
        assert_eq!(kind("hello world"), None);
        assert_eq!(kind("just some prose here"), None);
    }

    #[test]
    fn ignores_empty_input() {
        assert_eq!(kind(""), None);
        assert_eq!(kind("   "), None);
    }

    #[test]
    fn json_takes_priority_over_base64() {
        // A JSON object is detected as JSON, not base64.
        assert_eq!(kind(r#"{"a":1}"#).as_deref(), Some("json"));
    }
}
