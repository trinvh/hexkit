//! Base58 string encoding and decoding (Bitcoin alphabet).

use crate::error::{ToolError, ToolResult};
use serde::Deserialize;
use serde_json::Value;

/// Encode UTF-8 text as Base58 using the Bitcoin alphabet.
pub fn encode(input: &str) -> String {
    bs58::encode(input.as_bytes()).into_string()
}

/// Decode Base58 text to UTF-8. Returns [`ToolError::InvalidInput`] for input
/// containing characters outside the Bitcoin alphabet or for bytes that are
/// not valid UTF-8.
pub fn decode(input: &str) -> ToolResult<String> {
    let bytes = bs58::decode(input.trim())
        .into_vec()
        .map_err(|e| ToolError::invalid_input(e.to_string()))?;
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
        "base58.encode" => Ok(Value::String(encode(&parsed.input))),
        "base58.decode" => Ok(Value::String(decode(&parsed.input)?)),
        _ => Err(ToolError::invalid_input(format!("unknown action: {action}"))),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn encodes_ascii() {
        assert_eq!(encode("hello"), "Cn8eVZg");
    }

    #[test]
    fn encodes_utf8_multibyte() {
        assert_eq!(encode("héllo"), "uAqQtLcn");
    }

    #[test]
    fn encodes_empty_to_empty() {
        assert_eq!(encode(""), "");
    }

    #[test]
    fn decodes_to_text() {
        assert_eq!(decode("Cn8eVZg").unwrap(), "hello");
    }

    #[test]
    fn decodes_empty_to_empty() {
        assert_eq!(decode("").unwrap(), "");
    }

    #[test]
    fn ignores_surrounding_whitespace() {
        assert_eq!(decode("  Cn8eVZg \n").unwrap(), "hello");
    }

    #[test]
    fn rejects_invalid_characters() {
        // `0`, `O`, `I`, `l` are excluded from the Bitcoin alphabet.
        assert!(matches!(decode("0OIl"), Err(ToolError::InvalidInput(_))));
    }

    #[test]
    fn rejects_non_utf8_bytes() {
        // "LUv" decodes to 0xFF 0xFF, which is not valid UTF-8.
        assert!(matches!(decode("LUv"), Err(ToolError::InvalidInput(_))));
    }

    #[test]
    fn round_trips() {
        let text = "The quick brown fox 🦊";
        assert_eq!(decode(&encode(text)).unwrap(), text);
    }

    #[test]
    fn unknown_action_is_invalid_input() {
        let err = dispatch("base58.nope", serde_json::json!({ "input": "x" })).unwrap_err();
        assert!(matches!(err, ToolError::InvalidInput(_)));
    }
}
