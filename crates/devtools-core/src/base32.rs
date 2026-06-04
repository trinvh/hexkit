//! Base32 string encoding and decoding (RFC 4648, alphabet `A-Z2-7`).

use crate::error::{ToolError, ToolResult};
use serde::Deserialize;
use serde_json::Value;

/// RFC 4648 Base32 alphabet: bits `0..=25` map to `A-Z`, `26..=31` to `2-7`.
const ALPHABET: &[u8; 32] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

/// Encode UTF-8 text as RFC 4648 Base32 with `=` padding.
pub fn encode(input: &str) -> String {
    let bytes = input.as_bytes();
    let mut out = String::with_capacity(bytes.len().div_ceil(5) * 8);

    // Process 40-bit (5-byte) groups, each yielding eight 5-bit symbols.
    for chunk in bytes.chunks(5) {
        let mut buf = [0u8; 5];
        buf[..chunk.len()].copy_from_slice(chunk);
        let n = u64::from_be_bytes([0, 0, 0, buf[0], buf[1], buf[2], buf[3], buf[4]]);

        // Number of meaningful symbols for this chunk length (1->2, 2->4, 3->5, 4->7, 5->8).
        let symbols = match chunk.len() {
            1 => 2,
            2 => 4,
            3 => 5,
            4 => 7,
            _ => 8,
        };
        for i in 0..8 {
            if i < symbols {
                let shift = 35 - i * 5;
                let idx = ((n >> shift) & 0x1f) as usize;
                out.push(ALPHABET[idx] as char);
            } else {
                out.push('=');
            }
        }
    }
    out
}

/// Map a single Base32 symbol back to its 5-bit value. Returns `None` for
/// characters outside the RFC 4648 alphabet.
fn symbol_value(c: char) -> Option<u8> {
    match c {
        'A'..='Z' => Some(c as u8 - b'A'),
        '2'..='7' => Some(c as u8 - b'2' + 26),
        _ => None,
    }
}

/// Decode Base32 text to UTF-8. Tolerant of lowercase input, missing padding,
/// and embedded whitespace. Returns [`ToolError::InvalidInput`] for empty
/// input, invalid Base32, or bytes that are not valid UTF-8.
pub fn decode(input: &str) -> ToolResult<String> {
    if input.trim().is_empty() {
        return Err(ToolError::invalid_input("input is empty"));
    }

    // Strip whitespace and trailing padding; uppercase so lowercase input decodes.
    let cleaned: String = input
        .chars()
        .filter(|c| !c.is_whitespace() && *c != '=')
        .flat_map(char::to_uppercase)
        .collect();

    // Accumulate 5 bits per symbol, emitting a byte whenever 8+ bits are buffered.
    let mut bytes: Vec<u8> = Vec::with_capacity(cleaned.len() * 5 / 8);
    let mut acc: u32 = 0;
    let mut bits: u32 = 0;
    for c in cleaned.chars() {
        let value = symbol_value(c)
            .ok_or_else(|| ToolError::invalid_input(format!("invalid Base32 character: {c}")))?;
        acc = (acc << 5) | value as u32;
        bits += 5;
        if bits >= 8 {
            bits -= 8;
            bytes.push((acc >> bits) as u8);
        }
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
        "base32.encode" => Ok(Value::String(encode(&parsed.input))),
        "base32.decode" => Ok(Value::String(decode(&parsed.input)?)),
        _ => Err(ToolError::invalid_input(format!("unknown action: {action}"))),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    // RFC 4648 §10 test vectors.
    #[test]
    fn encodes_rfc4648_vectors() {
        assert_eq!(encode(""), "");
        assert_eq!(encode("f"), "MY======");
        assert_eq!(encode("fo"), "MZXQ====");
        assert_eq!(encode("foo"), "MZXW6===");
        assert_eq!(encode("foob"), "MZXW6YQ=");
        assert_eq!(encode("fooba"), "MZXW6YTB");
        assert_eq!(encode("foobar"), "MZXW6YTBOI======");
    }

    #[test]
    fn encodes_utf8_multibyte() {
        // "héllo" -> bytes 68 C3 A9 6C 6C 6F.
        assert_eq!(encode("héllo"), "NDB2S3DMN4======");
    }

    #[test]
    fn decodes_rfc4648_vectors() {
        assert_eq!(decode("MY======").unwrap(), "f");
        assert_eq!(decode("MZXQ====").unwrap(), "fo");
        assert_eq!(decode("MZXW6===").unwrap(), "foo");
        assert_eq!(decode("MZXW6YQ=").unwrap(), "foob");
        assert_eq!(decode("MZXW6YTB").unwrap(), "fooba");
        assert_eq!(decode("MZXW6YTBOI======").unwrap(), "foobar");
    }

    #[test]
    fn decodes_without_padding() {
        assert_eq!(decode("MZXW6").unwrap(), "foo");
    }

    #[test]
    fn decodes_lowercase() {
        assert_eq!(decode("mzxw6yq=").unwrap(), "foob");
    }

    #[test]
    fn ignores_embedded_whitespace() {
        assert_eq!(decode("MZXW\n 6YTB").unwrap(), "fooba");
    }

    #[test]
    fn rejects_empty_input() {
        assert!(matches!(decode("   "), Err(ToolError::InvalidInput(_))));
    }

    #[test]
    fn rejects_invalid_characters() {
        // '0', '1', '8', '9' are not in the Base32 alphabet.
        assert!(matches!(decode("MZXW0"), Err(ToolError::InvalidInput(_))));
        assert!(matches!(decode("@@@@"), Err(ToolError::InvalidInput(_))));
    }

    #[test]
    fn rejects_non_utf8_bytes() {
        // "74======" decodes to a single 0xFF byte, which is not valid UTF-8.
        assert!(matches!(decode("74======"), Err(ToolError::InvalidInput(_))));
    }

    #[test]
    fn round_trips() {
        let text = "The quick brown fox 🦊";
        assert_eq!(decode(&encode(text)).unwrap(), text);
    }
}
