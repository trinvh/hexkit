//! HTML entity encoding / decoding.

use crate::error::{ToolError, ToolResult};
use serde::Deserialize;
use serde_json::Value;

/// Escape the five core HTML entities (`& < > " '`).
pub fn encode(input: &str) -> String {
    input
        .replace('&', "&amp;")
        .replace('<', "&lt;")
        .replace('>', "&gt;")
        .replace('"', "&quot;")
        .replace('\'', "&#39;")
}

/// Decode HTML entities — named (e.g. `&amp;`, `&copy;`) and numeric
/// (`&#169;`, `&#x41;`).
pub fn decode(input: &str) -> String {
    html_escape::decode_html_entities(input).into_owned()
}

#[derive(Deserialize)]
struct OneInput {
    input: String,
}

pub fn dispatch(action: &str, params: Value) -> ToolResult<Value> {
    let parsed: OneInput =
        serde_json::from_value(params).map_err(|e| ToolError::invalid_input(e.to_string()))?;
    match action {
        "html.encode" => Ok(Value::String(encode(&parsed.input))),
        "html.decode" => Ok(Value::String(decode(&parsed.input))),
        _ => Err(ToolError::invalid_input(format!("unknown action: {action}"))),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn encodes_core_entities() {
        assert_eq!(
            encode(r#"<div class="x">a & b</div>"#),
            "&lt;div class=&quot;x&quot;&gt;a &amp; b&lt;/div&gt;",
        );
    }

    #[test]
    fn encodes_single_quote_numerically() {
        assert_eq!(encode("it's"), "it&#39;s");
    }

    #[test]
    fn decodes_named_entities() {
        assert_eq!(decode("&lt;a&gt; &amp; &quot;b&quot;"), "<a> & \"b\"");
    }

    #[test]
    fn decodes_extended_and_numeric_entities() {
        assert_eq!(decode("&copy; &#169; &#x41;"), "© © A");
    }

    #[test]
    fn round_trips_core_entities() {
        let text = r#"a & b < c > d " e ' f"#;
        assert_eq!(decode(&encode(text)), text);
    }

    #[test]
    fn handles_empty() {
        assert_eq!(encode(""), "");
        assert_eq!(decode(""), "");
    }
}
