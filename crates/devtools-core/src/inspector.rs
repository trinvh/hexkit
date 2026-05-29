//! String statistics (characters, bytes, words, lines).

use crate::error::{ToolError, ToolResult};
use serde::{Deserialize, Serialize};
use serde_json::Value;

#[derive(Debug, Serialize, PartialEq, Eq)]
pub struct Stats {
    pub characters: usize,
    pub bytes: usize,
    pub words: usize,
    pub lines: usize,
}

/// Compute character, byte, word, and line counts for `input`.
pub fn inspect(input: &str) -> Stats {
    Stats {
        characters: input.chars().count(),
        bytes: input.len(),
        words: input.split_whitespace().count(),
        lines: if input.is_empty() {
            0
        } else {
            input.lines().count()
        },
    }
}

#[derive(Deserialize)]
struct OneInput {
    input: String,
}

pub fn dispatch(action: &str, params: Value) -> ToolResult<Value> {
    let parsed: OneInput =
        serde_json::from_value(params).map_err(|e| ToolError::invalid_input(e.to_string()))?;
    match action {
        "string.inspect" => {
            serde_json::to_value(inspect(&parsed.input)).map_err(|e| ToolError::other(e.to_string()))
        }
        _ => Err(ToolError::invalid_input(format!("unknown action: {action}"))),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn counts_ascii() {
        let s = inspect("hello world");
        assert_eq!(s.characters, 11);
        assert_eq!(s.bytes, 11);
        assert_eq!(s.words, 2);
        assert_eq!(s.lines, 1);
    }

    #[test]
    fn counts_lines() {
        assert_eq!(inspect("a\nb\nc").lines, 3);
    }

    #[test]
    fn counts_unicode_chars_vs_bytes() {
        let s = inspect("café");
        assert_eq!(s.characters, 4);
        assert_eq!(s.bytes, 5);
    }

    #[test]
    fn empty_input_is_all_zero() {
        let s = inspect("");
        assert_eq!(s.characters, 0);
        assert_eq!(s.words, 0);
        assert_eq!(s.lines, 0);
    }
}
