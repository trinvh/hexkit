//! XML beautify (re-indent) and minify (strip inter-tag whitespace).

use crate::error::{ToolError, ToolResult};
use quick_xml::events::Event;
use quick_xml::{Reader, Writer};
use serde::Deserialize;
use serde_json::Value;
use std::io::Cursor;

fn reformat(input: &str, indent: Option<usize>) -> ToolResult<String> {
    let mut reader = Reader::from_str(input.trim());
    let config = reader.config_mut();
    config.trim_text(true);
    config.check_end_names = true;

    let buffer = Cursor::new(Vec::new());
    let mut writer = match indent {
        Some(size) => Writer::new_with_indent(buffer, b' ', size),
        None => Writer::new(buffer),
    };

    loop {
        match reader.read_event() {
            Ok(Event::Eof) => break,
            Ok(event) => writer
                .write_event(event)
                .map_err(|e| ToolError::invalid_input(e.to_string()))?,
            Err(e) => return Err(ToolError::invalid_input(format!("XML error: {e}"))),
        }
    }

    let bytes = writer.into_inner().into_inner();
    String::from_utf8(bytes).map_err(|e| ToolError::other(e.to_string()))
}

/// Re-indent XML with two-space indentation.
pub fn beautify(input: &str) -> ToolResult<String> {
    reformat(input, Some(2))
}

/// Collapse XML to a single line.
pub fn minify(input: &str) -> ToolResult<String> {
    reformat(input, None)
}

#[derive(Deserialize)]
struct OneInput {
    input: String,
}

pub fn dispatch(action: &str, params: Value) -> ToolResult<Value> {
    let parsed: OneInput =
        serde_json::from_value(params).map_err(|e| ToolError::invalid_input(e.to_string()))?;
    match action {
        "xml.beautify" => Ok(Value::String(beautify(&parsed.input)?)),
        "xml.minify" => Ok(Value::String(minify(&parsed.input)?)),
        _ => Err(ToolError::invalid_input(format!("unknown action: {action}"))),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn beautifies_nested_xml() {
        let out = beautify("<a><b>x</b></a>").unwrap();
        assert!(out.contains("<a>"));
        assert!(out.contains("  <b>x</b>"));
    }

    #[test]
    fn minifies_xml() {
        assert_eq!(minify("<a>\n  <b>x</b>\n</a>").unwrap(), "<a><b>x</b></a>");
    }

    #[test]
    fn rejects_mismatched_tags() {
        assert!(matches!(beautify("<a></b>"), Err(ToolError::InvalidInput(_))));
    }
}
