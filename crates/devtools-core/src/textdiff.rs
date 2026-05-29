//! Line-by-line text diffing.

use crate::error::{ToolError, ToolResult};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use similar::{ChangeTag, TextDiff};

#[derive(Debug, Serialize, PartialEq, Eq)]
pub struct DiffLine {
    /// One of `"equal"`, `"insert"`, or `"delete"`.
    pub tag: String,
    pub value: String,
}

/// Diff `old` vs `new` after normalizing each side as `format`
/// (`"text"`, `"json"`, or `"xml"`). For JSON, `sort` sorts object keys.
pub fn diff_with(
    old: &str,
    new: &str,
    format: &str,
    sort: bool,
) -> ToolResult<Vec<DiffLine>> {
    let old_norm = normalize(old, format, sort, "Left")?;
    let new_norm = normalize(new, format, sort, "Right")?;
    Ok(diff(&old_norm, &new_norm))
}

/// Pretty-print a side as the chosen format. Empty sides stay empty so they
/// diff cleanly as pure insertions/deletions.
fn normalize(side: &str, format: &str, sort: bool, which: &str) -> ToolResult<String> {
    if side.trim().is_empty() {
        return Ok(String::new());
    }
    let result = match format {
        "json" => crate::json::format_opts(side, "  ", sort),
        "xml" => crate::xml::beautify(side),
        _ => return Ok(side.to_string()),
    };
    result.map_err(|e| ToolError::invalid_input(format!("{which} side: {e}")))
}

/// Produce a line-level diff of `old` vs `new`.
pub fn diff(old: &str, new: &str) -> Vec<DiffLine> {
    TextDiff::from_lines(old, new)
        .iter_all_changes()
        .map(|change| {
            let tag = match change.tag() {
                ChangeTag::Equal => "equal",
                ChangeTag::Insert => "insert",
                ChangeTag::Delete => "delete",
            };
            let raw = change.value();
            let value = raw.strip_suffix('\n').unwrap_or(raw);
            let value = value.strip_suffix('\r').unwrap_or(value);
            DiffLine {
                tag: tag.to_string(),
                value: value.to_string(),
            }
        })
        .collect()
}

fn default_format() -> String {
    "text".to_string()
}

#[derive(Deserialize)]
struct DiffParams {
    old: String,
    new: String,
    #[serde(default = "default_format")]
    format: String,
    #[serde(default)]
    sort: bool,
}

pub fn dispatch(action: &str, params: Value) -> ToolResult<Value> {
    let parsed: DiffParams =
        serde_json::from_value(params).map_err(|e| ToolError::invalid_input(e.to_string()))?;
    match action {
        "diff.compare" => serde_json::to_value(diff_with(
            &parsed.old,
            &parsed.new,
            &parsed.format,
            parsed.sort,
        )?)
        .map_err(|e| ToolError::other(e.to_string())),
        _ => Err(ToolError::invalid_input(format!("unknown action: {action}"))),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn tags(lines: &[DiffLine]) -> Vec<&str> {
        lines.iter().map(|l| l.tag.as_str()).collect()
    }

    #[test]
    fn reports_changed_lines() {
        let lines = diff("a\nb\nc", "a\nx\nc");
        assert_eq!(tags(&lines), ["equal", "delete", "insert", "equal"]);
        assert_eq!(lines[0].value, "a");
        assert_eq!(lines[1].value, "b");
        assert_eq!(lines[2].value, "x");
        assert_eq!(lines[3].value, "c");
    }

    #[test]
    fn identical_text_is_all_equal() {
        let lines = diff("a\nb", "a\nb");
        assert_eq!(tags(&lines), ["equal", "equal"]);
    }

    #[test]
    fn pure_insertion() {
        let lines = diff("", "added");
        assert_eq!(tags(&lines), ["insert"]);
        assert_eq!(lines[0].value, "added");
    }

    #[test]
    fn pure_deletion() {
        let lines = diff("gone", "");
        assert_eq!(tags(&lines), ["delete"]);
        assert_eq!(lines[0].value, "gone");
    }

    #[test]
    fn json_sort_makes_reordered_objects_equal() {
        let lines =
            diff_with(r#"{"b":1,"a":2}"#, r#"{"a":2,"b":1}"#, "json", true).unwrap();
        assert!(lines.iter().all(|l| l.tag == "equal"));
    }

    #[test]
    fn json_without_sort_keeps_order_differences() {
        let lines =
            diff_with(r#"{"b":1,"a":2}"#, r#"{"a":2,"b":1}"#, "json", false).unwrap();
        assert!(lines.iter().any(|l| l.tag != "equal"));
    }

    #[test]
    fn json_normalizes_whitespace_before_diffing() {
        let lines = diff_with(r#"{"a":1}"#, "{ \"a\" : 1 }", "json", false).unwrap();
        assert!(lines.iter().all(|l| l.tag == "equal"));
    }

    #[test]
    fn xml_normalizes_before_diffing() {
        let lines =
            diff_with("<a><b>1</b></a>", "<a>\n  <b>1</b>\n</a>", "xml", false).unwrap();
        assert!(lines.iter().all(|l| l.tag == "equal"));
    }

    #[test]
    fn invalid_json_reports_which_side() {
        let err = diff_with("{bad}", r#"{"a":1}"#, "json", false).unwrap_err();
        let ToolError::InvalidInput(message) = err else {
            panic!("expected InvalidInput");
        };
        assert!(message.contains("Left"), "message: {message}");
    }

    #[test]
    fn empty_side_is_allowed_in_format_mode() {
        let lines = diff_with("", r#"{"a":1}"#, "json", false).unwrap();
        assert!(lines.iter().any(|l| l.tag == "insert"));
    }
}
