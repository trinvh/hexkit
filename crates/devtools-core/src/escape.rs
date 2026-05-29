//! Backslash escape / unescape for common string escape sequences.

use crate::error::{ToolError, ToolResult};
use serde::Deserialize;
use serde_json::Value;

/// Escape `\`, newlines, tabs, carriage returns, and double quotes.
pub fn escape(input: &str) -> String {
    let mut out = String::with_capacity(input.len());
    for ch in input.chars() {
        match ch {
            '\\' => out.push_str("\\\\"),
            '\n' => out.push_str("\\n"),
            '\t' => out.push_str("\\t"),
            '\r' => out.push_str("\\r"),
            '"' => out.push_str("\\\""),
            other => out.push(other),
        }
    }
    out
}

/// Unescape common sequences (`\n \t \r \\ \" \' \0 \uXXXX`). Returns
/// [`ToolError::InvalidInput`] on an unknown or malformed escape.
pub fn unescape(input: &str) -> ToolResult<String> {
    let mut out = String::with_capacity(input.len());
    let mut chars = input.chars();
    while let Some(ch) = chars.next() {
        if ch != '\\' {
            out.push(ch);
            continue;
        }
        match chars.next() {
            Some('n') => out.push('\n'),
            Some('t') => out.push('\t'),
            Some('r') => out.push('\r'),
            Some('\\') => out.push('\\'),
            Some('"') => out.push('"'),
            Some('\'') => out.push('\''),
            Some('0') => out.push('\0'),
            Some('u') => {
                let hex: String = chars.by_ref().take(4).collect();
                let code = u32::from_str_radix(&hex, 16)
                    .ok()
                    .and_then(char::from_u32)
                    .ok_or_else(|| ToolError::invalid_input(format!("invalid \\u escape: \\u{hex}")))?;
                out.push(code);
            }
            Some(other) => {
                return Err(ToolError::invalid_input(format!("unknown escape: \\{other}")));
            }
            None => return Err(ToolError::invalid_input("trailing backslash")),
        }
    }
    Ok(out)
}

#[derive(Deserialize)]
struct OneInput {
    input: String,
}

pub fn dispatch(action: &str, params: Value) -> ToolResult<Value> {
    let parsed: OneInput =
        serde_json::from_value(params).map_err(|e| ToolError::invalid_input(e.to_string()))?;
    match action {
        "escape.escape" => Ok(Value::String(escape(&parsed.input))),
        "escape.unescape" => Ok(Value::String(unescape(&parsed.input)?)),
        _ => Err(ToolError::invalid_input(format!("unknown action: {action}"))),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn escapes_specials() {
        assert_eq!(escape("a\"b\n\tc\\d"), "a\\\"b\\n\\tc\\\\d");
    }

    #[test]
    fn unescapes_sequences() {
        assert_eq!(unescape("a\\nb\\tc").unwrap(), "a\nb\tc");
        assert_eq!(unescape("\\\\ \\\"").unwrap(), "\\ \"");
    }

    #[test]
    fn unescapes_unicode() {
        assert_eq!(unescape("\\u0041\\u00e9").unwrap(), "Aé");
    }

    #[test]
    fn rejects_unknown_escape() {
        assert!(matches!(unescape("\\q"), Err(ToolError::InvalidInput(_))));
    }

    #[test]
    fn rejects_trailing_backslash() {
        assert!(matches!(unescape("abc\\"), Err(ToolError::InvalidInput(_))));
    }

    #[test]
    fn rejects_bad_unicode() {
        assert!(matches!(unescape("\\uzzzz"), Err(ToolError::InvalidInput(_))));
    }

    #[test]
    fn round_trips() {
        let text = "line1\nline2\t\"quoted\" \\back\\";
        assert_eq!(unescape(&escape(text)).unwrap(), text);
    }
}
