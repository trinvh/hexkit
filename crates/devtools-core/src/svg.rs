//! SVG -> CSS `background-image` data URI.

use crate::error::{ToolError, ToolResult};
use serde::Deserialize;
use serde_json::Value;

/// Wrap an SVG document as a base64 data-URI CSS `background-image` value.
pub fn to_css(input: &str) -> ToolResult<String> {
    let trimmed = input.trim();
    if trimmed.is_empty() {
        return Err(ToolError::invalid_input("input is empty"));
    }
    if !trimmed.contains("<svg") {
        return Err(ToolError::invalid_input("input does not look like SVG"));
    }
    let encoded = crate::base64::encode(trimmed);
    Ok(format!(
        "background-image: url(\"data:image/svg+xml;base64,{encoded}\");"
    ))
}

#[derive(Deserialize)]
struct OneInput {
    input: String,
}

pub fn dispatch(action: &str, params: Value) -> ToolResult<Value> {
    let parsed: OneInput =
        serde_json::from_value(params).map_err(|e| ToolError::invalid_input(e.to_string()))?;
    match action {
        "svg.to_css" => Ok(Value::String(to_css(&parsed.input)?)),
        _ => Err(ToolError::invalid_input(format!("unknown action: {action}"))),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn wraps_svg_as_data_uri() {
        let css = to_css("<svg></svg>").unwrap();
        assert!(css.starts_with("background-image: url(\"data:image/svg+xml;base64,"));
        assert!(css.ends_with("\");"));
    }

    #[test]
    fn rejects_non_svg() {
        assert!(matches!(to_css("hello"), Err(ToolError::InvalidInput(_))));
    }

    #[test]
    fn rejects_empty() {
        assert!(matches!(to_css("  "), Err(ToolError::InvalidInput(_))));
    }
}
