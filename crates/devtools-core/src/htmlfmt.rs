//! HTML beautify (markup_fmt) and minify (minify-html).

use crate::error::{ToolError, ToolResult};
use serde::Deserialize;
use serde_json::Value;
use std::borrow::Cow;

/// Beautify (pretty-print) HTML.
pub fn beautify(input: &str) -> ToolResult<String> {
    use markup_fmt::{config::FormatOptions, format_text, Language};
    let options = FormatOptions::default();
    format_text(input, Language::Html, &options, |code, _| {
        anyhow::Ok(Cow::Borrowed(code))
    })
    .map_err(|e| ToolError::invalid_input(format!("{e:?}")))
}

/// Minify HTML.
pub fn minify(input: &str) -> ToolResult<String> {
    let cfg = minify_html::Cfg::new();
    let out = minify_html::minify(input.as_bytes(), &cfg);
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
        "htmlfmt.beautify" => Ok(Value::String(beautify(&parsed.input)?)),
        "htmlfmt.minify" => Ok(Value::String(minify(&parsed.input)?)),
        _ => Err(ToolError::invalid_input(format!("unknown action: {action}"))),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn beautifies_html() {
        let out = beautify("<div><p>hi</p></div>").unwrap();
        assert!(out.contains("<div>"));
        assert!(out.contains('\n'));
    }

    #[test]
    fn minifies_html() {
        let source = "<div>\n  <p>hi</p>\n</div>";
        let out = minify(source).unwrap();
        assert!(out.len() < source.len());
        assert!(out.contains("hi"));
        assert!(!out.contains('\n'));
    }
}
