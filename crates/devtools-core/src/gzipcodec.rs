//! Gzip compress / decompress, with Base64 framing for the compressed bytes.

use crate::error::{ToolError, ToolResult};
use flate2::read::GzDecoder;
use flate2::write::GzEncoder;
use flate2::Compression;
use serde::Deserialize;
use serde_json::Value;
use std::io::{Read, Write};
// `::base64` is the external crate, used here for binary (non-UTF-8) framing —
// the gzip stream is raw bytes, so the string-only `crate::base64` API does not
// fit. We mirror its standard-engine choice for wire compatibility.
use ::base64::engine::general_purpose::STANDARD;
use ::base64::Engine as _;

/// Compress UTF-8 text with gzip and return the bytes as standard Base64.
pub fn compress(input: &str) -> ToolResult<String> {
    let mut encoder = GzEncoder::new(Vec::new(), Compression::default());
    encoder
        .write_all(input.as_bytes())
        .map_err(|e| ToolError::other(e.to_string()))?;
    let bytes = encoder.finish().map_err(|e| ToolError::other(e.to_string()))?;
    Ok(STANDARD.encode(bytes))
}

/// Decode Base64, gunzip the bytes, and return the original UTF-8 text. Returns
/// [`ToolError::InvalidInput`] for invalid Base64, malformed gzip, or bytes that
/// are not valid UTF-8.
pub fn decompress(input: &str) -> ToolResult<String> {
    let bytes = STANDARD
        .decode(input.trim())
        .map_err(|e| ToolError::invalid_input(e.to_string()))?;
    let mut decoder = GzDecoder::new(&bytes[..]);
    let mut out = Vec::new();
    decoder
        .read_to_end(&mut out)
        .map_err(|_| ToolError::invalid_input("input is not valid gzip data"))?;
    String::from_utf8(out)
        .map_err(|_| ToolError::invalid_input("decompressed bytes are not valid UTF-8"))
}

#[derive(Deserialize)]
struct OneInput {
    input: String,
}

pub fn dispatch(action: &str, params: Value) -> ToolResult<Value> {
    let parsed: OneInput =
        serde_json::from_value(params).map_err(|e| ToolError::invalid_input(e.to_string()))?;
    match action {
        "gzip.compress" => Ok(Value::String(compress(&parsed.input)?)),
        "gzip.decompress" => Ok(Value::String(decompress(&parsed.input)?)),
        _ => Err(ToolError::invalid_input(format!("unknown action: {action}"))),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn round_trips() {
        let text = "The quick brown fox 🦊 jumps over the lazy dog.";
        assert_eq!(decompress(&compress(text).unwrap()).unwrap(), text);
    }

    #[test]
    fn compresses_empty_to_valid_gzip() {
        let encoded = compress("").unwrap();
        assert_eq!(decompress(&encoded).unwrap(), "");
    }

    #[test]
    fn compress_output_is_base64() {
        let encoded = compress("hello").unwrap();
        // The encoded form decodes cleanly back through the gzip layer.
        assert!(decompress(&encoded).is_ok());
    }

    #[test]
    fn rejects_invalid_base64() {
        assert!(matches!(
            decompress("@@@@"),
            Err(ToolError::InvalidInput(_))
        ));
    }

    #[test]
    fn rejects_non_gzip_payload() {
        // Valid Base64 ("hello") but not a gzip stream.
        let not_gzip = STANDARD.encode("hello");
        assert!(matches!(
            decompress(&not_gzip),
            Err(ToolError::InvalidInput(_))
        ));
    }
}
