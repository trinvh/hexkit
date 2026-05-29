//! Regular expression testing (JS-like via fancy-regex).

use crate::error::{ToolError, ToolResult};
use fancy_regex::Regex;
use serde::{Deserialize, Serialize};
use serde_json::Value;

#[derive(Debug, Serialize, PartialEq, Eq)]
pub struct RegexMatch {
    pub value: String,
    pub index: usize,
    pub groups: Vec<Option<String>>,
}

#[derive(Debug, Serialize, PartialEq, Eq)]
pub struct RegexResult {
    pub matches: Vec<RegexMatch>,
}

/// Find all matches of `pattern` in `text`. `flags` accepts `i`, `m`, `s`, `x`.
pub fn test(pattern: &str, text: &str, flags: &str) -> ToolResult<RegexResult> {
    let inline: String = flags
        .chars()
        .filter(|c| matches!(c, 'i' | 'm' | 's' | 'x'))
        .collect();
    let full = if inline.is_empty() {
        pattern.to_string()
    } else {
        format!("(?{inline}){pattern}")
    };
    let re = Regex::new(&full).map_err(|e| ToolError::invalid_input(e.to_string()))?;

    let mut matches = Vec::new();
    for caps in re.captures_iter(text) {
        let caps = caps.map_err(|e| ToolError::other(e.to_string()))?;
        let whole = caps.get(0).expect("group 0 always present");
        let groups = (1..caps.len())
            .map(|i| caps.get(i).map(|m| m.as_str().to_string()))
            .collect();
        matches.push(RegexMatch {
            value: whole.as_str().to_string(),
            index: whole.start(),
            groups,
        });
    }
    Ok(RegexResult { matches })
}

#[derive(Deserialize)]
struct RegexParams {
    pattern: String,
    text: String,
    #[serde(default)]
    flags: String,
}

pub fn dispatch(action: &str, params: Value) -> ToolResult<Value> {
    let p: RegexParams =
        serde_json::from_value(params).map_err(|e| ToolError::invalid_input(e.to_string()))?;
    match action {
        "regexp.test" => {
            serde_json::to_value(test(&p.pattern, &p.text, &p.flags)?)
                .map_err(|e| ToolError::other(e.to_string()))
        }
        _ => Err(ToolError::invalid_input(format!("unknown action: {action}"))),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn finds_all_matches_with_indices() {
        let result = test(r"\d+", "a1b22", "").unwrap();
        assert_eq!(result.matches.len(), 2);
        assert_eq!(result.matches[0].value, "1");
        assert_eq!(result.matches[0].index, 1);
        assert_eq!(result.matches[1].value, "22");
        assert_eq!(result.matches[1].index, 3);
    }

    #[test]
    fn captures_groups() {
        let result = test(r"(\w)(\d)", "x9", "").unwrap();
        assert_eq!(
            result.matches[0].groups,
            vec![Some("x".to_string()), Some("9".to_string())]
        );
    }

    #[test]
    fn honours_case_insensitive_flag() {
        assert_eq!(test("abc", "ABC", "i").unwrap().matches.len(), 1);
        assert_eq!(test("abc", "ABC", "").unwrap().matches.len(), 0);
    }

    #[test]
    fn rejects_invalid_pattern() {
        assert!(matches!(test("(", "x", ""), Err(ToolError::InvalidInput(_))));
    }
}
