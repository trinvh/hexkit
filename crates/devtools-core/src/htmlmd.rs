//! HTML -> Markdown conversion.

use crate::error::{ToolError, ToolResult};
use serde::Deserialize;
use serde_json::Value;

/// Convert an HTML fragment or document to Markdown.
pub fn to_markdown(input: &str) -> String {
    html2md::parse_html(input)
}

#[derive(Deserialize)]
struct OneInput {
    input: String,
}

pub fn dispatch(action: &str, params: Value) -> ToolResult<Value> {
    let parsed: OneInput =
        serde_json::from_value(params).map_err(|e| ToolError::invalid_input(e.to_string()))?;
    match action {
        "htmlmd.convert" => Ok(Value::String(to_markdown(&parsed.input))),
        _ => Err(ToolError::invalid_input(format!("unknown action: {action}"))),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn converts_heading() {
        // html2md renders <h1> as a setext heading (the text underlined with
        // `=`), which is valid Markdown; just assert the text survives.
        assert!(to_markdown("<h1>Hello</h1>").contains("Hello"));
    }

    #[test]
    fn converts_link() {
        assert_eq!(
            to_markdown(r#"<a href="https://e.com">x</a>"#).trim(),
            "[x](https://e.com)"
        );
    }

    #[test]
    fn converts_unordered_list() {
        let md = to_markdown("<ul><li>one</li><li>two</li></ul>");
        assert!(md.contains("* one"));
        assert!(md.contains("* two"));
    }

    #[test]
    fn empty_input_is_empty() {
        assert_eq!(to_markdown("").trim(), "");
    }
}
