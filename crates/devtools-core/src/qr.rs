//! QR code generation (SVG) and reading (from an encoded image).

use crate::error::{ToolError, ToolResult};
use ::base64::Engine as _;
use qrcode::QrCode;
use serde::Deserialize;
use serde_json::Value;

/// Generate an SVG QR code for `text`.
pub fn generate_svg(text: &str) -> ToolResult<String> {
    if text.is_empty() {
        return Err(ToolError::invalid_input("input is empty"));
    }
    let code = QrCode::new(text.as_bytes()).map_err(|e| ToolError::invalid_input(e.to_string()))?;
    let svg = code
        .render::<qrcode::render::svg::Color>()
        .min_dimensions(220, 220)
        .build();
    Ok(svg)
}

/// Decode the first QR code found in a base64-encoded image (data URI allowed).
pub fn read(image_base64: &str) -> ToolResult<String> {
    let payload = image_base64
        .rsplit(',')
        .next()
        .unwrap_or(image_base64)
        .trim();
    let bytes = ::base64::engine::general_purpose::STANDARD
        .decode(payload)
        .map_err(|e| ToolError::invalid_input(e.to_string()))?;
    let image = image::load_from_memory(&bytes)
        .map_err(|e| ToolError::invalid_input(e.to_string()))?;
    let mut prepared = rqrr::PreparedImage::prepare(image.to_luma8());
    let grids = prepared.detect_grids();
    for grid in grids {
        if let Ok((_meta, content)) = grid.decode() {
            return Ok(content);
        }
    }
    Err(ToolError::invalid_input("no QR code found in image"))
}

#[derive(Deserialize)]
struct OneInput {
    input: String,
}

pub fn dispatch(action: &str, params: Value) -> ToolResult<Value> {
    let parsed: OneInput =
        serde_json::from_value(params).map_err(|e| ToolError::invalid_input(e.to_string()))?;
    match action {
        "qr.generate" => Ok(Value::String(generate_svg(&parsed.input)?)),
        "qr.read" => Ok(Value::String(read(&parsed.input)?)),
        _ => Err(ToolError::invalid_input(format!("unknown action: {action}"))),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn generates_svg() {
        let svg = generate_svg("hello").unwrap();
        assert!(svg.contains("<svg"));
    }

    #[test]
    fn rejects_empty_generate() {
        assert!(matches!(generate_svg(""), Err(ToolError::InvalidInput(_))));
    }

    #[test]
    fn round_trips_generate_then_read() {
        let code = QrCode::new(b"hello hexkit").unwrap();
        let img = code
            .render::<image::Luma<u8>>()
            .min_dimensions(220, 220)
            .build();
        let mut png = Vec::new();
        image::DynamicImage::ImageLuma8(img)
            .write_to(&mut std::io::Cursor::new(&mut png), image::ImageFormat::Png)
            .unwrap();
        let b64 = ::base64::engine::general_purpose::STANDARD.encode(&png);
        assert_eq!(read(&b64).unwrap(), "hello hexkit");
    }

    #[test]
    fn rejects_invalid_image() {
        assert!(matches!(read("@@@notbase64"), Err(ToolError::InvalidInput(_))));
    }
}
