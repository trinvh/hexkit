//! Base64 string encoding and decoding.

use crate::error::{ToolError, ToolResult};
use serde::Deserialize;
use serde_json::Value;
// `::base64` is the external crate (disambiguated from this same-named module).
use ::base64::alphabet;
use ::base64::engine::general_purpose::{GeneralPurpose, GeneralPurposeConfig, STANDARD};
use ::base64::engine::DecodePaddingMode;
use ::base64::Engine as _;

/// Encode UTF-8 text as standard (padded) Base64.
pub fn encode(input: &str) -> String {
    STANDARD.encode(input.as_bytes())
}

/// Decode Base64 text to UTF-8. Tolerant of the URL-safe alphabet, missing
/// padding, and embedded whitespace. Returns [`ToolError::InvalidInput`] for
/// empty input, invalid Base64, or bytes that are not valid UTF-8.
pub fn decode(input: &str) -> ToolResult<String> {
    if input.trim().is_empty() {
        return Err(ToolError::invalid_input("input is empty"));
    }
    // Normalise the URL-safe alphabet and strip embedded whitespace.
    let cleaned: String = input
        .chars()
        .filter(|c| !c.is_whitespace())
        .map(|c| match c {
            '-' => '+',
            '_' => '/',
            other => other,
        })
        .collect();

    let config = GeneralPurposeConfig::new()
        .with_decode_padding_mode(DecodePaddingMode::Indifferent)
        .with_decode_allow_trailing_bits(true);
    let engine = GeneralPurpose::new(&alphabet::STANDARD, config);

    let bytes = engine
        .decode(cleaned.as_bytes())
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
        "base64.encode" => Ok(Value::String(encode(&parsed.input))),
        "base64.decode" => Ok(Value::String(decode(&parsed.input)?)),
        _ => Err(ToolError::invalid_input(format!("unknown action: {action}"))),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn encodes_ascii() {
        assert_eq!(encode("hello"), "aGVsbG8=");
    }

    #[test]
    fn encodes_utf8_multibyte() {
        assert_eq!(encode("héllo"), "aMOpbGxv");
    }

    #[test]
    fn encodes_empty_to_empty() {
        assert_eq!(encode(""), "");
    }

    #[test]
    fn decodes_standard_padded() {
        assert_eq!(decode("aGVsbG8=").unwrap(), "hello");
    }

    #[test]
    fn decodes_without_padding() {
        assert_eq!(decode("aGVsbG8").unwrap(), "hello");
    }

    #[test]
    fn decodes_url_safe_alphabet() {
        // "???" -> standard "Pz8/" / url-safe "Pz8_"; both must decode.
        assert_eq!(decode("Pz8/").unwrap(), "???");
        assert_eq!(decode("Pz8_").unwrap(), "???");
    }

    #[test]
    fn ignores_embedded_whitespace() {
        assert_eq!(decode("aGVs\n bG8=").unwrap(), "hello");
    }

    #[test]
    fn rejects_empty_input() {
        assert!(matches!(decode("   "), Err(ToolError::InvalidInput(_))));
    }

    #[test]
    fn rejects_invalid_characters() {
        assert!(matches!(decode("@@@@"), Err(ToolError::InvalidInput(_))));
    }

    #[test]
    fn rejects_non_utf8_bytes() {
        // "//8=" decodes to 0xFF 0xFF, which is not valid UTF-8.
        assert!(matches!(decode("//8="), Err(ToolError::InvalidInput(_))));
    }

    #[test]
    fn round_trips() {
        let text = "The quick brown fox 🦊";
        assert_eq!(decode(&encode(text)).unwrap(), text);
    }
}
