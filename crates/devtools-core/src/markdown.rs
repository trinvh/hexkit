//! Markdown -> HTML rendering (for preview).

use crate::error::{ToolError, ToolResult};
use pulldown_cmark::{html, Options, Parser};
use serde::Deserialize;
use serde_json::Value;

/// Render Markdown to HTML (CommonMark + tables, strikethrough, task lists).
pub fn to_html(input: &str) -> String {
    let mut options = Options::empty();
    options.insert(Options::ENABLE_TABLES);
    options.insert(Options::ENABLE_STRIKETHROUGH);
    options.insert(Options::ENABLE_TASKLISTS);
    let parser = Parser::new_ext(input, options);
    let mut out = String::new();
    html::push_html(&mut out, parser);
    out
}

#[derive(Deserialize)]
struct OneInput {
    input: String,
}

pub fn dispatch(action: &str, params: Value) -> ToolResult<Value> {
    let parsed: OneInput =
        serde_json::from_value(params).map_err(|e| ToolError::invalid_input(e.to_string()))?;
    match action {
        "markdown.to_html" => Ok(Value::String(to_html(&parsed.input))),
        _ => Err(ToolError::invalid_input(format!("unknown action: {action}"))),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn renders_headings() {
        assert!(to_html("# Hi").contains("<h1>Hi</h1>"));
    }

    #[test]
    fn renders_emphasis() {
        assert!(to_html("**bold**").contains("<strong>bold</strong>"));
    }

    #[test]
    fn renders_links() {
        assert!(to_html("[x](https://e.com)").contains(r#"<a href="https://e.com">x</a>"#));
    }
}
