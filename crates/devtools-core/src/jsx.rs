//! Basic HTML -> JSX attribute conversion.

use crate::error::{ToolError, ToolResult};
use serde::Deserialize;
use serde_json::Value;

/// Common HTML attributes renamed for JSX.
const RENAMES: &[(&str, &str)] = &[
    (" class=", " className="),
    (" for=", " htmlFor="),
    (" tabindex=", " tabIndex="),
    (" readonly=", " readOnly="),
    (" maxlength=", " maxLength="),
    (" colspan=", " colSpan="),
    (" rowspan=", " rowSpan="),
    (" contenteditable=", " contentEditable="),
    (" autocomplete=", " autoComplete="),
    (" autofocus=", " autoFocus="),
    (" srcset=", " srcSet="),
];

/// Rename common HTML attributes to their JSX equivalents. This is a
/// best-effort textual transform, not a full HTML parser.
pub fn from_html(input: &str) -> String {
    let mut out = input.to_string();
    for (from, to) in RENAMES {
        out = out.replace(from, to);
    }
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
        "jsx.from_html" => Ok(Value::String(from_html(&parsed.input))),
        _ => Err(ToolError::invalid_input(format!("unknown action: {action}"))),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn renames_class_and_for() {
        assert_eq!(
            from_html(r#"<label class="a" for="x">"#),
            r#"<label className="a" htmlFor="x">"#
        );
    }

    #[test]
    fn renames_additional_attributes() {
        assert_eq!(
            from_html(r#"<td colspan="2" tabindex="0">"#),
            r#"<td colSpan="2" tabIndex="0">"#
        );
    }

    #[test]
    fn leaves_other_markup_untouched() {
        assert_eq!(from_html("<p>hello</p>"), "<p>hello</p>");
    }
}
