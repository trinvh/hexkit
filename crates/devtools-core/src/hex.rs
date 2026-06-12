//! Hex <-> ASCII/UTF-8 conversion.

use crate::error::{ToolError, ToolResult};
use serde::Deserialize;
use serde_json::Value;

/// Characters allowed to separate bytes in hex input (and that `encode` may emit
/// as a delimiter). Stripped before decoding so formatted hex round-trips.
fn is_separator(c: char) -> bool {
    c.is_whitespace() || matches!(c, ':' | '-' | ',' | '_' | '.')
}

/// Encode text as hex of its UTF-8 bytes.
///
/// `uppercase` selects the digit case; `delimiter` is inserted between every
/// byte (empty for continuous output).
pub fn encode(input: &str, uppercase: bool, delimiter: &str) -> String {
    let bytes = input.as_bytes();
    let mut out = String::with_capacity(bytes.len() * 2 + bytes.len().saturating_sub(1) * delimiter.len());
    for (i, b) in bytes.iter().enumerate() {
        if i > 0 {
            out.push_str(delimiter);
        }
        if uppercase {
            out.push_str(&format!("{b:02X}"));
        } else {
            out.push_str(&format!("{b:02x}"));
        }
    }
    out
}

/// Decode hex (whitespace, common byte separators, and a leading `0x` are
/// ignored) to UTF-8 text.
pub fn decode(input: &str) -> ToolResult<String> {
    let cleaned: String = input.chars().filter(|c| !is_separator(*c)).collect();
    let cleaned = cleaned
        .strip_prefix("0x")
        .or_else(|| cleaned.strip_prefix("0X"))
        .unwrap_or(&cleaned);
    if cleaned.is_empty() {
        return Err(ToolError::invalid_input("input is empty"));
    }
    if !cleaned.len().is_multiple_of(2) {
        return Err(ToolError::invalid_input("hex input must have an even length"));
    }
    let mut bytes = Vec::with_capacity(cleaned.len() / 2);
    let chars: Vec<char> = cleaned.chars().collect();
    for pair in chars.chunks(2) {
        let hex: String = pair.iter().collect();
        let byte = u8::from_str_radix(&hex, 16)
            .map_err(|_| ToolError::invalid_input(format!("invalid hex byte: {hex}")))?;
        bytes.push(byte);
    }
    String::from_utf8(bytes)
        .map_err(|_| ToolError::invalid_input("decoded bytes are not valid UTF-8"))
}

fn default_uppercase() -> bool {
    true
}

#[derive(Deserialize)]
struct EncodeParams {
    input: String,
    /// Output digit case. Defaults to uppercase.
    #[serde(default = "default_uppercase")]
    uppercase: bool,
    /// Separator inserted between bytes. Defaults to none.
    #[serde(default)]
    delimiter: String,
}

#[derive(Deserialize)]
struct DecodeParams {
    input: String,
}

pub fn dispatch(action: &str, params: Value) -> ToolResult<Value> {
    match action {
        "hex.encode" => {
            let p: EncodeParams = serde_json::from_value(params)
                .map_err(|e| ToolError::invalid_input(e.to_string()))?;
            Ok(Value::String(encode(&p.input, p.uppercase, &p.delimiter)))
        }
        "hex.decode" => {
            let p: DecodeParams = serde_json::from_value(params)
                .map_err(|e| ToolError::invalid_input(e.to_string()))?;
            Ok(Value::String(decode(&p.input)?))
        }
        _ => Err(ToolError::invalid_input(format!("unknown action: {action}"))),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn encodes_ascii_uppercase_by_default() {
        assert_eq!(encode("AB", true, ""), "4142");
    }

    #[test]
    fn encodes_lowercase() {
        // 'é' is two UTF-8 bytes (C3 A9) so the case is visible.
        assert_eq!(encode("é", false, ""), "c3a9");
        assert_eq!(encode("é", true, ""), "C3A9");
    }

    #[test]
    fn encodes_with_delimiter() {
        assert_eq!(encode("ABC", true, ":"), "41:42:43");
        assert_eq!(encode("ABC", false, " "), "41 42 43");
        assert_eq!(encode("", true, ":"), "");
        assert_eq!(encode("A", true, ":"), "41");
    }

    #[test]
    fn decodes_continuous_hex() {
        assert_eq!(decode("4142").unwrap(), "AB");
    }

    #[test]
    fn ignores_spaces_separators_and_prefix() {
        assert_eq!(decode("41 42").unwrap(), "AB");
        assert_eq!(decode("0x4142").unwrap(), "AB");
        assert_eq!(decode("41:42:43").unwrap(), "ABC");
        assert_eq!(decode("41-42-43").unwrap(), "ABC");
    }

    #[test]
    fn rejects_odd_length() {
        assert!(matches!(decode("123"), Err(ToolError::InvalidInput(_))));
    }

    #[test]
    fn rejects_non_hex() {
        assert!(matches!(decode("4g"), Err(ToolError::InvalidInput(_))));
    }

    #[test]
    fn rejects_empty() {
        assert!(matches!(decode("   "), Err(ToolError::InvalidInput(_))));
    }

    #[test]
    fn rejects_non_utf8() {
        assert!(matches!(decode("ff"), Err(ToolError::InvalidInput(_))));
    }

    #[test]
    fn round_trips_with_delimiter() {
        let encoded = encode("Hello, héllo!", true, ":");
        assert_eq!(decode(&encoded).unwrap(), "Hello, héllo!");
    }

    #[test]
    fn dispatch_encode_defaults_to_uppercase() {
        let out = dispatch("hex.encode", serde_json::json!({ "input": "é" })).unwrap();
        assert_eq!(out, Value::String("C3A9".into()));
    }

    #[test]
    fn dispatch_encode_honours_options() {
        let out = dispatch(
            "hex.encode",
            serde_json::json!({ "input": "ABC", "uppercase": false, "delimiter": " " }),
        )
        .unwrap();
        assert_eq!(out, Value::String("41 42 43".into()));
    }
}
