//! Lorem ipsum placeholder text generation.

use crate::error::{ToolError, ToolResult};
use serde::Deserialize;
use serde_json::Value;

const WORDS_PER_PARAGRAPH: usize = 45;

/// Generate placeholder text. `kind` is `"words"` or `"paragraphs"`.
pub fn generate(kind: &str, count: usize) -> ToolResult<String> {
    let n = count.clamp(1, 500);
    match kind {
        "words" => Ok(lipsum::lipsum_words(n)),
        "paragraphs" => Ok((0..n)
            .map(|_| lipsum::lipsum_words(WORDS_PER_PARAGRAPH))
            .collect::<Vec<_>>()
            .join("\n\n")),
        other => Err(ToolError::invalid_input(format!("unknown kind: {other}"))),
    }
}

#[derive(Deserialize)]
struct LoremParams {
    kind: String,
    count: usize,
}

pub fn dispatch(action: &str, params: Value) -> ToolResult<Value> {
    let p: LoremParams =
        serde_json::from_value(params).map_err(|e| ToolError::invalid_input(e.to_string()))?;
    match action {
        "lorem.generate" => Ok(Value::String(generate(&p.kind, p.count)?)),
        _ => Err(ToolError::invalid_input(format!("unknown action: {action}"))),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn generates_requested_word_count() {
        assert_eq!(
            generate("words", 5).unwrap().split_whitespace().count(),
            5
        );
    }

    #[test]
    fn generates_requested_paragraph_count() {
        let text = generate("paragraphs", 3).unwrap();
        assert_eq!(text.split("\n\n").count(), 3);
    }

    #[test]
    fn rejects_unknown_kind() {
        assert!(matches!(
            generate("haiku", 3),
            Err(ToolError::InvalidInput(_))
        ));
    }

    #[test]
    fn clamps_count_to_at_least_one() {
        assert!(!generate("words", 0).unwrap().is_empty());
    }
}
