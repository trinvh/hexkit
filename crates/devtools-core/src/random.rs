//! Random string generation.

use crate::error::{ToolError, ToolResult};
use rand::RngExt;
use serde::Deserialize;
use serde_json::Value;

const UPPER: &str = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const LOWER: &str = "abcdefghijklmnopqrstuvwxyz";
const DIGITS: &str = "0123456789";
const SYMBOLS: &str = "!@#$%^&*()-_=+[]{};:,.<>?";

/// Generate a random string of `length` (1..=1024) from the selected sets.
pub fn generate(
    length: usize,
    uppercase: bool,
    lowercase: bool,
    digits: bool,
    symbols: bool,
) -> ToolResult<String> {
    let mut charset = String::new();
    if uppercase {
        charset.push_str(UPPER);
    }
    if lowercase {
        charset.push_str(LOWER);
    }
    if digits {
        charset.push_str(DIGITS);
    }
    if symbols {
        charset.push_str(SYMBOLS);
    }
    if charset.is_empty() {
        return Err(ToolError::invalid_input("select at least one character set"));
    }

    let pool: Vec<char> = charset.chars().collect();
    let len = length.clamp(1, 1024);
    let mut rng = rand::rng();
    let result: String = (0..len)
        .map(|_| pool[rng.random_range(0..pool.len())])
        .collect();
    Ok(result)
}

#[derive(Deserialize)]
struct RandomParams {
    length: usize,
    uppercase: bool,
    lowercase: bool,
    digits: bool,
    symbols: bool,
}

pub fn dispatch(action: &str, params: Value) -> ToolResult<Value> {
    let p: RandomParams =
        serde_json::from_value(params).map_err(|e| ToolError::invalid_input(e.to_string()))?;
    match action {
        "random.generate" => Ok(Value::String(generate(
            p.length, p.uppercase, p.lowercase, p.digits, p.symbols,
        )?)),
        _ => Err(ToolError::invalid_input(format!("unknown action: {action}"))),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn generates_requested_length() {
        assert_eq!(generate(16, true, true, true, true).unwrap().len(), 16);
    }

    #[test]
    fn respects_selected_charset() {
        let s = generate(64, true, false, false, false).unwrap();
        assert!(s.chars().all(|c| c.is_ascii_uppercase()));

        let d = generate(64, false, false, true, false).unwrap();
        assert!(d.chars().all(|c| c.is_ascii_digit()));
    }

    #[test]
    fn rejects_empty_charset() {
        assert!(matches!(
            generate(10, false, false, false, false),
            Err(ToolError::InvalidInput(_))
        ));
    }

    #[test]
    fn clamps_length() {
        assert_eq!(generate(0, true, false, false, false).unwrap().len(), 1);
        assert_eq!(generate(5000, true, false, false, false).unwrap().len(), 1024);
    }
}
