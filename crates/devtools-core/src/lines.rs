//! Line operations: trim, dedupe, and sort.

use crate::error::{ToolError, ToolResult};
use serde::Deserialize;
use serde_json::Value;

/// Trim, dedupe, and/or sort the lines of `input`. `sort` is one of
/// `"none"`, `"asc"`, `"desc"`. Dedupe preserves first occurrence.
pub fn process(
    input: &str,
    sort: &str,
    dedupe: bool,
    trim: bool,
    case_insensitive: bool,
) -> ToolResult<String> {
    let mut lines: Vec<String> = input
        .lines()
        .map(|line| if trim { line.trim().to_string() } else { line.to_string() })
        .collect();

    if dedupe {
        let mut seen = std::collections::HashSet::new();
        lines.retain(|line| {
            let key = if case_insensitive {
                line.to_lowercase()
            } else {
                line.clone()
            };
            seen.insert(key)
        });
    }

    match sort {
        "none" => {}
        "asc" | "desc" => {
            if case_insensitive {
                lines.sort_by_key(|line| line.to_lowercase());
            } else {
                lines.sort();
            }
            if sort == "desc" {
                lines.reverse();
            }
        }
        other => return Err(ToolError::invalid_input(format!("unknown sort mode: {other}"))),
    }

    Ok(lines.join("\n"))
}

#[derive(Deserialize)]
struct LinesParams {
    input: String,
    #[serde(default = "default_sort")]
    sort: String,
    #[serde(default)]
    dedupe: bool,
    #[serde(default)]
    trim: bool,
    #[serde(default)]
    case_insensitive: bool,
}

fn default_sort() -> String {
    "none".to_string()
}

pub fn dispatch(action: &str, params: Value) -> ToolResult<Value> {
    let p: LinesParams =
        serde_json::from_value(params).map_err(|e| ToolError::invalid_input(e.to_string()))?;
    match action {
        "lines.process" => Ok(Value::String(process(
            &p.input,
            &p.sort,
            p.dedupe,
            p.trim,
            p.case_insensitive,
        )?)),
        _ => Err(ToolError::invalid_input(format!("unknown action: {action}"))),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn sorts_ascending() {
        assert_eq!(process("b\na\nc", "asc", false, false, false).unwrap(), "a\nb\nc");
    }

    #[test]
    fn sorts_descending() {
        assert_eq!(process("a\nc\nb", "desc", false, false, false).unwrap(), "c\nb\na");
    }

    #[test]
    fn dedupes_preserving_order() {
        assert_eq!(process("b\na\nb\na", "none", true, false, false).unwrap(), "b\na");
    }

    #[test]
    fn trims_each_line() {
        assert_eq!(process("  a  \n b ", "none", false, true, false).unwrap(), "a\nb");
    }

    #[test]
    fn dedupe_is_case_insensitive_when_requested() {
        assert_eq!(process("A\na\nB", "none", true, false, true).unwrap(), "A\nB");
    }

    #[test]
    fn sort_is_case_insensitive_when_requested() {
        assert_eq!(process("b\nA\nc", "asc", false, false, true).unwrap(), "A\nb\nc");
    }

    #[test]
    fn rejects_unknown_sort() {
        assert!(matches!(
            process("a", "sideways", false, false, false),
            Err(ToolError::InvalidInput(_))
        ));
    }
}
