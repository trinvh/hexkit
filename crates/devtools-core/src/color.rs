//! Color format conversion (hex / rgb / hsl, named colors).

use crate::error::{ToolError, ToolResult};
use serde::{Deserialize, Serialize};
use serde_json::Value;

#[derive(Debug, Serialize, PartialEq, Eq)]
pub struct ColorOut {
    pub hex: String,
    pub rgb: String,
    pub hsl: String,
}

/// Parse any CSS color (hex, rgb(), hsl(), named) and render it in each format.
pub fn convert(input: &str) -> ToolResult<ColorOut> {
    let color = csscolorparser::parse(input.trim())
        .map_err(|e| ToolError::invalid_input(e.to_string()))?;

    let [r, g, b, _a] = color.to_rgba8();
    let [h, s, l, _] = color.to_hsla();

    Ok(ColorOut {
        hex: format!("#{r:02x}{g:02x}{b:02x}"),
        rgb: format!("rgb({r}, {g}, {b})"),
        hsl: format!("hsl({}, {}%, {}%)", h.round(), (s * 100.0).round(), (l * 100.0).round()),
    })
}

#[derive(Deserialize)]
struct OneInput {
    input: String,
}

pub fn dispatch(action: &str, params: Value) -> ToolResult<Value> {
    let parsed: OneInput =
        serde_json::from_value(params).map_err(|e| ToolError::invalid_input(e.to_string()))?;
    match action {
        "color.convert" => {
            serde_json::to_value(convert(&parsed.input)).map_err(|e| ToolError::other(e.to_string()))
        }
        _ => Err(ToolError::invalid_input(format!("unknown action: {action}"))),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn converts_hex() {
        let c = convert("#ff0000").unwrap();
        assert_eq!(c.hex, "#ff0000");
        assert_eq!(c.rgb, "rgb(255, 0, 0)");
        assert_eq!(c.hsl, "hsl(0, 100%, 50%)");
    }

    #[test]
    fn parses_rgb_function() {
        assert_eq!(convert("rgb(0, 255, 0)").unwrap().hex, "#00ff00");
    }

    #[test]
    fn parses_named_color() {
        assert_eq!(convert("red").unwrap().hex, "#ff0000");
    }

    #[test]
    fn rejects_invalid_color() {
        assert!(matches!(convert("notacolor"), Err(ToolError::InvalidInput(_))));
    }
}
