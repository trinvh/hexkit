//! Hex <-> ASCII/UTF-8 conversion.

use crate::error::{ToolError, ToolResult};
use serde::Deserialize;
use serde_json::Value;

/// Encode text as continuous lowercase hex of its UTF-8 bytes.
pub fn encode(input: &str) -> String {
    input.bytes().map(|b| format!("{b:02x}")).collect()
}

/// Decode hex (whitespace and a leading `0x` are ignored) to UTF-8 text.
pub fn decode(input: &str) -> ToolResult<String> {
    let cleaned: String = input.split_whitespace().collect();
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

#[derive(Deserialize)]
struct OneInput {
    input: String,
}

pub fn dispatch(action: &str, params: Value) -> ToolResult<Value> {
    let parsed: OneInput =
        serde_json::from_value(params).map_err(|e| ToolError::invalid_input(e.to_string()))?;
    match action {
        "hex.encode" => Ok(Value::String(encode(&parsed.input))),
        "hex.decode" => Ok(Value::String(decode(&parsed.input)?)),
        _ => Err(ToolError::invalid_input(format!("unknown action: {action}"))),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn encodes_ascii() {
        assert_eq!(encode("AB"), "4142");
    }

    #[test]
    fn encodes_utf8() {
        assert_eq!(encode("é"), "c3a9");
    }

    #[test]
    fn decodes_continuous_hex() {
        assert_eq!(decode("4142").unwrap(), "AB");
    }

    #[test]
    fn ignores_spaces_and_prefix() {
        assert_eq!(decode("41 42").unwrap(), "AB");
        assert_eq!(decode("0x4142").unwrap(), "AB");
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
    fn round_trips() {
        assert_eq!(decode(&encode("Hello, héllo!")).unwrap(), "Hello, héllo!");
    }
}
