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

/// Build a compiled regex, applying `flags` (`i`, `m`, `s`, `x`) as inline flags.
fn compile(pattern: &str, flags: &str) -> ToolResult<Regex> {
    let inline: String = flags
        .chars()
        .filter(|c| matches!(c, 'i' | 'm' | 's' | 'x'))
        .collect();
    let full = if inline.is_empty() {
        pattern.to_string()
    } else {
        format!("(?{inline}){pattern}")
    };
    Regex::new(&full).map_err(|e| ToolError::invalid_input(e.to_string()))
}

/// Find all matches of `pattern` in `text`. `flags` accepts `i`, `m`, `s`, `x`.
pub fn test(pattern: &str, text: &str, flags: &str) -> ToolResult<RegexResult> {
    let re = compile(pattern, flags)?;

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

/// Replace every match of `pattern` in `text` with `replacement`. The
/// replacement supports `$1` / `${name}` group references and `$0` for the
/// whole match.
pub fn replace(
    pattern: &str,
    text: &str,
    flags: &str,
    replacement: &str,
) -> ToolResult<String> {
    let re = compile(pattern, flags)?;
    Ok(re.replace_all(text, replacement).into_owned())
}

#[derive(Deserialize)]
struct RegexParams {
    pattern: String,
    text: String,
    #[serde(default)]
    flags: String,
}

#[derive(Deserialize)]
struct ReplaceParams {
    pattern: String,
    text: String,
    #[serde(default)]
    flags: String,
    replacement: String,
}

pub fn dispatch(action: &str, params: Value) -> ToolResult<Value> {
    match action {
        "regexp.test" => {
            let p: RegexParams = serde_json::from_value(params)
                .map_err(|e| ToolError::invalid_input(e.to_string()))?;
            serde_json::to_value(test(&p.pattern, &p.text, &p.flags)?)
                .map_err(|e| ToolError::other(e.to_string()))
        }
        "regexp.replace" => {
            let p: ReplaceParams = serde_json::from_value(params)
                .map_err(|e| ToolError::invalid_input(e.to_string()))?;
            Ok(Value::String(replace(
                &p.pattern,
                &p.text,
                &p.flags,
                &p.replacement,
            )?))
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

    #[test]
    fn replaces_all_matches_with_group_references() {
        let out = replace(r"(\w+)@(\w+)", "alice@example", "", "$2.$1").unwrap();
        assert_eq!(out, "example.alice");
    }

    #[test]
    fn replace_honours_flags() {
        let out = replace("a", "AbA", "i", "X").unwrap();
        assert_eq!(out, "XbX");
    }

    #[test]
    fn replace_leaves_non_matches_intact() {
        let out = replace(r"\d", "abc", "", "X").unwrap();
        assert_eq!(out, "abc");
    }

    #[test]
    fn replace_rejects_invalid_pattern() {
        assert!(matches!(
            replace("(", "x", "", "y"),
            Err(ToolError::InvalidInput(_))
        ));
    }
}
