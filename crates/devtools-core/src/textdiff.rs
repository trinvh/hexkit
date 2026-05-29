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

#[derive(Deserialize)]
struct DiffParams {
    old: String,
    new: String,
}

pub fn dispatch(action: &str, params: Value) -> ToolResult<Value> {
    let parsed: DiffParams =
        serde_json::from_value(params).map_err(|e| ToolError::invalid_input(e.to_string()))?;
    match action {
        "diff.compare" => {
            serde_json::to_value(diff(&parsed.old, &parsed.new))
                .map_err(|e| ToolError::other(e.to_string()))
        }
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
}
