//! JavaScript minification.

use crate::error::{ToolError, ToolResult};
use minify_js::{minify, Session, TopLevelMode};
use serde::Deserialize;
use serde_json::Value;

/// Minify JavaScript source.
pub fn minify_js(input: &str) -> ToolResult<String> {
    let trimmed = input.trim();
    if trimmed.is_empty() {
        return Err(ToolError::invalid_input("input is empty"));
    }
    let session = Session::new();
    let mut out = Vec::new();
    minify(&session, TopLevelMode::Global, trimmed.as_bytes(), &mut out)
        .map_err(|e| ToolError::invalid_input(format!("{e:?}")))?;
    String::from_utf8(out).map_err(|e| ToolError::other(e.to_string()))
}

#[derive(Deserialize)]
struct OneInput {
    input: String,
}

pub fn dispatch(action: &str, params: Value) -> ToolResult<Value> {
    let parsed: OneInput =
        serde_json::from_value(params).map_err(|e| ToolError::invalid_input(e.to_string()))?;
    match action {
        "js.minify" => Ok(Value::String(minify_js(&parsed.input)?)),
        _ => Err(ToolError::invalid_input(format!("unknown action: {action}"))),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn minifies_javascript() {
        let out = minify_js("const  x   =   1  +  2 ;").unwrap();
        assert!(out.len() <= "const  x   =   1  +  2 ;".len());
        assert!(out.contains('x'));
    }

    #[test]
    fn rejects_empty() {
        assert!(matches!(minify_js("   "), Err(ToolError::InvalidInput(_))));
    }
}
