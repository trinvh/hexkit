//! Number base conversion between binary, octal, decimal, and hexadecimal.

use crate::error::{ToolError, ToolResult};
use serde::{Deserialize, Serialize};
use serde_json::Value;

#[derive(Debug, Serialize, PartialEq, Eq)]
pub struct Bases {
    pub binary: String,
    pub octal: String,
    pub decimal: String,
    pub hexadecimal: String,
}

/// Parse `input` as a number in `base` (2, 8, 10, or 16) and render it in all
/// four bases. Negative values are supported. Returns
/// [`ToolError::InvalidInput`] for empty or unparseable input.
pub fn convert(input: &str, base: u32) -> ToolResult<Bases> {
    if !(2..=36).contains(&base) {
        return Err(ToolError::invalid_input(format!("unsupported base: {base}")));
    }
    let trimmed = input.trim();
    if trimmed.is_empty() {
        return Err(ToolError::invalid_input("input is empty"));
    }
    let value = i128::from_str_radix(trimmed, base)
        .map_err(|_| ToolError::invalid_input(format!("not a valid base-{base} number")))?;
    let sign = if value < 0 { "-" } else { "" };
    let magnitude = value.unsigned_abs();
    Ok(Bases {
        binary: format!("{sign}{magnitude:b}"),
        octal: format!("{sign}{magnitude:o}"),
        decimal: format!("{sign}{magnitude}"),
        hexadecimal: format!("{sign}{magnitude:x}"),
    })
}

#[derive(Deserialize)]
struct ConvertParams {
    input: String,
    base: u32,
}

pub fn dispatch(action: &str, params: Value) -> ToolResult<Value> {
    match action {
        "number.convert" => {
            let p: ConvertParams = serde_json::from_value(params)
                .map_err(|e| ToolError::invalid_input(e.to_string()))?;
            let bases = convert(&p.input, p.base)?;
            serde_json::to_value(bases).map_err(|e| ToolError::other(e.to_string()))
        }
        _ => Err(ToolError::invalid_input(format!("unknown action: {action}"))),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn converts_decimal_to_all_bases() {
        let out = convert("255", 10).unwrap();
        assert_eq!(out.binary, "11111111");
        assert_eq!(out.octal, "377");
        assert_eq!(out.decimal, "255");
        assert_eq!(out.hexadecimal, "ff");
    }

    #[test]
    fn parses_hexadecimal_input() {
        let out = convert("ff", 16).unwrap();
        assert_eq!(out.decimal, "255");
        assert_eq!(out.binary, "11111111");
    }

    #[test]
    fn parses_uppercase_hex() {
        assert_eq!(convert("FF", 16).unwrap().decimal, "255");
    }

    #[test]
    fn parses_binary_input() {
        let out = convert("11111111", 2).unwrap();
        assert_eq!(out.decimal, "255");
        assert_eq!(out.hexadecimal, "ff");
    }

    #[test]
    fn supports_negative_numbers() {
        let out = convert("-10", 10).unwrap();
        assert_eq!(out.binary, "-1010");
        assert_eq!(out.hexadecimal, "-a");
        assert_eq!(out.decimal, "-10");
    }

    #[test]
    fn rejects_empty_input() {
        assert!(matches!(convert("  ", 10), Err(ToolError::InvalidInput(_))));
    }

    #[test]
    fn rejects_invalid_digits_for_base() {
        assert!(matches!(convert("xyz", 10), Err(ToolError::InvalidInput(_))));
        assert!(matches!(convert("zz", 16), Err(ToolError::InvalidInput(_))));
        assert!(matches!(convert("2", 2), Err(ToolError::InvalidInput(_))));
    }
}
