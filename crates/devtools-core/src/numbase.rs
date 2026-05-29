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

/// Parse `input` in `from_base` and render it in `to_base`. Both bases must be
/// in 2..=36. Supports negatives and zero.
pub fn to_base(input: &str, from_base: u32, to_base: u32) -> ToolResult<String> {
    if !(2..=36).contains(&from_base) || !(2..=36).contains(&to_base) {
        return Err(ToolError::invalid_input("base must be between 2 and 36"));
    }
    let trimmed = input.trim();
    if trimmed.is_empty() {
        return Err(ToolError::invalid_input("input is empty"));
    }
    let value = i128::from_str_radix(trimmed, from_base)
        .map_err(|_| ToolError::invalid_input(format!("not a valid base-{from_base} number")))?;
    Ok(render_radix(value, to_base))
}

/// Render a signed integer in an arbitrary base using digits 0-9a-z.
fn render_radix(value: i128, base: u32) -> String {
    if value == 0 {
        return "0".to_string();
    }
    const DIGITS: &[u8] = b"0123456789abcdefghijklmnopqrstuvwxyz";
    let sign = if value < 0 { "-" } else { "" };
    let mut magnitude = value.unsigned_abs();
    let radix = base as u128;
    let mut buf = Vec::new();
    while magnitude > 0 {
        buf.push(DIGITS[(magnitude % radix) as usize]);
        magnitude /= radix;
    }
    buf.reverse();
    format!("{sign}{}", String::from_utf8(buf).expect("ascii digits"))
}

#[derive(Debug, Serialize, PartialEq, Eq)]
pub struct AllBases {
    pub binary: String,
    pub octal: String,
    pub decimal: String,
    pub hexadecimal: String,
    pub custom: String,
}

/// Read `input` in `base` and render it in binary, octal, decimal, hex, and an
/// arbitrary `custom_base` in one call.
pub fn all(input: &str, base: u32, custom_base: u32) -> ToolResult<AllBases> {
    let bases = convert(input, base)?;
    let custom = to_base(input, base, custom_base)?;
    Ok(AllBases {
        binary: bases.binary,
        octal: bases.octal,
        decimal: bases.decimal,
        hexadecimal: bases.hexadecimal,
        custom,
    })
}

#[derive(Deserialize)]
struct ConvertParams {
    input: String,
    base: u32,
}

#[derive(Deserialize)]
struct AllParams {
    input: String,
    base: u32,
    custom_base: u32,
}

#[derive(Deserialize)]
struct ToBaseParams {
    input: String,
    from_base: u32,
    to_base: u32,
}

pub fn dispatch(action: &str, params: Value) -> ToolResult<Value> {
    match action {
        "number.convert" => {
            let p: ConvertParams = serde_json::from_value(params)
                .map_err(|e| ToolError::invalid_input(e.to_string()))?;
            let bases = convert(&p.input, p.base)?;
            serde_json::to_value(bases).map_err(|e| ToolError::other(e.to_string()))
        }
        "number.to_base" => {
            let p: ToBaseParams = serde_json::from_value(params)
                .map_err(|e| ToolError::invalid_input(e.to_string()))?;
            Ok(Value::String(to_base(&p.input, p.from_base, p.to_base)?))
        }
        "number.all" => {
            let p: AllParams = serde_json::from_value(params)
                .map_err(|e| ToolError::invalid_input(e.to_string()))?;
            serde_json::to_value(all(&p.input, p.base, p.custom_base)?)
                .map_err(|e| ToolError::other(e.to_string()))
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

    #[test]
    fn renders_into_an_arbitrary_target_base() {
        assert_eq!(to_base("255", 10, 16).unwrap(), "ff");
        assert_eq!(to_base("255", 10, 2).unwrap(), "11111111");
        // 255 = 7*36 + 3 -> "73" in base 36.
        assert_eq!(to_base("255", 10, 36).unwrap(), "73");
    }

    #[test]
    fn converts_between_two_non_decimal_bases() {
        assert_eq!(to_base("ff", 16, 10).unwrap(), "255");
        assert_eq!(to_base("zz", 36, 10).unwrap(), "1295");
    }

    #[test]
    fn to_base_handles_zero_and_negatives() {
        assert_eq!(to_base("0", 10, 16).unwrap(), "0");
        assert_eq!(to_base("-255", 10, 16).unwrap(), "-ff");
    }

    #[test]
    fn to_base_rejects_invalid_base_or_digits() {
        assert!(matches!(
            to_base("10", 10, 99),
            Err(ToolError::InvalidInput(_))
        ));
        assert!(matches!(
            to_base("xyz", 10, 16),
            Err(ToolError::InvalidInput(_))
        ));
    }

    #[test]
    fn all_returns_every_base() {
        let a = all("255", 10, 16).unwrap();
        assert_eq!(a.binary, "11111111");
        assert_eq!(a.octal, "377");
        assert_eq!(a.decimal, "255");
        assert_eq!(a.hexadecimal, "ff");
        assert_eq!(a.custom, "ff");
    }

    #[test]
    fn all_reads_input_in_its_base() {
        // "ff" is hex 255.
        let a = all("ff", 16, 36).unwrap();
        assert_eq!(a.decimal, "255");
        assert_eq!(a.custom, "73");
    }

    #[test]
    fn all_rejects_invalid() {
        assert!(matches!(all("zz", 10, 16), Err(ToolError::InvalidInput(_))));
    }
}
