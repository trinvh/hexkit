//! String case conversion (camel, pascal, snake, kebab, constant, …).

use crate::error::{ToolError, ToolResult};
use serde::{Deserialize, Serialize};
use serde_json::Value;

#[derive(Debug, Serialize, PartialEq, Eq)]
pub struct Cases {
    pub camel: String,
    pub pascal: String,
    pub snake: String,
    pub kebab: String,
    pub constant: String,
    pub title: String,
    pub sentence: String,
    pub lower: String,
    pub upper: String,
}

/// Convert `input` into every supported case style.
pub fn convert(input: &str) -> Cases {
    let words = split_words(input);
    let camel = words
        .iter()
        .enumerate()
        .map(|(i, w)| if i == 0 { w.clone() } else { capitalize(w) })
        .collect::<String>();
    let pascal = words.iter().map(|w| capitalize(w)).collect::<String>();
    let snake = words.join("_");
    let kebab = words.join("-");
    let constant = snake.to_uppercase();
    let title = words
        .iter()
        .map(|w| capitalize(w))
        .collect::<Vec<_>>()
        .join(" ");
    let lower = words.join(" ");
    let upper = lower.to_uppercase();
    let sentence = capitalize(&lower);
    Cases {
        camel,
        pascal,
        snake,
        kebab,
        constant,
        title,
        sentence,
        lower,
        upper,
    }
}

/// Split into lowercased words on separators and camelCase / acronym boundaries.
fn split_words(input: &str) -> Vec<String> {
    let chars: Vec<char> = input.chars().collect();
    let mut words = Vec::new();
    let mut current = String::new();
    for (i, &c) in chars.iter().enumerate() {
        if !c.is_alphanumeric() {
            if !current.is_empty() {
                words.push(std::mem::take(&mut current));
            }
            continue;
        }
        if !current.is_empty() {
            let prev = chars[i - 1];
            let next_is_lower = chars.get(i + 1).is_some_and(|n| n.is_lowercase());
            let boundary = ((prev.is_lowercase() || prev.is_ascii_digit()) && c.is_uppercase())
                || (prev.is_uppercase() && c.is_uppercase() && next_is_lower);
            if boundary {
                words.push(std::mem::take(&mut current));
            }
        }
        current.push(c);
    }
    if !current.is_empty() {
        words.push(current);
    }
    words.iter().map(|w| w.to_lowercase()).collect()
}

fn capitalize(word: &str) -> String {
    let mut chars = word.chars();
    match chars.next() {
        Some(first) => first.to_uppercase().collect::<String>() + chars.as_str(),
        None => String::new(),
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
        "case.convert" => {
            serde_json::to_value(convert(&parsed.input))
                .map_err(|e| ToolError::other(e.to_string()))
        }
        _ => Err(ToolError::invalid_input(format!("unknown action: {action}"))),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn converts_space_separated_words() {
        let c = convert("hello world");
        assert_eq!(c.camel, "helloWorld");
        assert_eq!(c.pascal, "HelloWorld");
        assert_eq!(c.snake, "hello_world");
        assert_eq!(c.kebab, "hello-world");
        assert_eq!(c.constant, "HELLO_WORLD");
        assert_eq!(c.title, "Hello World");
        assert_eq!(c.sentence, "Hello world");
        assert_eq!(c.lower, "hello world");
        assert_eq!(c.upper, "HELLO WORLD");
    }

    #[test]
    fn splits_camel_case_input() {
        assert_eq!(convert("helloWorld").snake, "hello_world");
    }

    #[test]
    fn handles_acronyms() {
        let c = convert("HTTPRequest");
        assert_eq!(c.snake, "http_request");
        assert_eq!(c.camel, "httpRequest");
    }

    #[test]
    fn normalises_mixed_separators() {
        assert_eq!(convert("foo-bar_baz qux").snake, "foo_bar_baz_qux");
    }

    #[test]
    fn keeps_digits_with_their_word() {
        assert_eq!(convert("version2Build").snake, "version2_build");
    }

    #[test]
    fn empty_input_yields_empty_cases() {
        let c = convert("");
        assert_eq!(c.camel, "");
        assert_eq!(c.snake, "");
        assert_eq!(c.title, "");
    }
}
