//! Luhn (mod-10) check digit utilities — credit card, IMEI, ID validation.

use crate::error::{ToolError, ToolResult};
use serde::{Deserialize, Serialize};
use serde_json::Value;

#[derive(Debug, Serialize, PartialEq, Eq)]
pub struct LuhnReport {
    /// Just the digit characters from the input (spaces/dashes stripped).
    pub digits: String,
    /// True when `digits` already passes the Luhn check.
    pub valid: bool,
    /// `luhn_sum(digits) mod 10` — non-zero indicates how far from valid.
    pub checksum_mod_10: u32,
    /// The check digit the input's last character SHOULD be to make Luhn pass.
    pub expected_check_digit: u32,
    /// The actual last digit the caller supplied.
    pub provided_check_digit: u32,
    /// Input rewritten so its last digit is `expected_check_digit`. Convenient
    /// "fix me" output when validation fails.
    pub corrected: String,
}

pub fn analyze(input: &str) -> ToolResult<LuhnReport> {
    let digits: String = input.chars().filter(|c| c.is_ascii_digit()).collect();
    if digits.len() < 2 {
        return Err(ToolError::invalid_input(
            "Enter at least two digits to run a Luhn check.",
        ));
    }
    let vec: Vec<u32> = digits.chars().filter_map(|c| c.to_digit(10)).collect();
    let provided = *vec.last().unwrap();
    let sum_mod = luhn_sum(&vec) % 10;
    let expected = compute_check_digit(&vec[..vec.len() - 1]);

    let mut corrected = digits.clone();
    corrected.pop();
    corrected.push(char::from_digit(expected, 10).unwrap());

    Ok(LuhnReport {
        digits,
        valid: sum_mod == 0,
        checksum_mod_10: sum_mod,
        expected_check_digit: expected,
        provided_check_digit: provided,
        corrected,
    })
}

/// Sum of `digits` using the Luhn doubling rule (from the rightmost digit).
pub(crate) fn luhn_sum(digits: &[u32]) -> u32 {
    digits
        .iter()
        .rev()
        .enumerate()
        .map(|(i, &d)| {
            if i % 2 == 1 {
                let dd = d * 2;
                if dd > 9 {
                    dd - 9
                } else {
                    dd
                }
            } else {
                d
            }
        })
        .sum()
}

/// The check digit (0..=9) needed to make `prefix` (without its check digit)
/// a Luhn-valid number when appended.
pub fn compute_check_digit(prefix: &[u32]) -> u32 {
    // The check digit sits at position 0 (rightmost). Push a 0 to align the
    // prefix into positions 1..n+1, then solve for the digit that drives the
    // total to a multiple of 10.
    let mut padded = prefix.to_vec();
    padded.push(0);
    let sum = luhn_sum(&padded);
    (10 - sum % 10) % 10
}

pub fn dispatch(action: &str, params: Value) -> ToolResult<Value> {
    #[derive(Deserialize)]
    struct In {
        input: String,
    }
    let p: In = serde_json::from_value(params)
        .map_err(|e| ToolError::invalid_input(e.to_string()))?;
    match action {
        "luhn.check" => serde_json::to_value(analyze(&p.input)?)
            .map_err(|e| ToolError::other(e.to_string())),
        _ => Err(ToolError::invalid_input(format!("unknown action: {action}"))),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn validates_a_known_visa_test_number() {
        let r = analyze("4111 1111 1111 1111").unwrap();
        assert!(r.valid);
        assert_eq!(r.checksum_mod_10, 0);
        assert_eq!(r.expected_check_digit, 1);
        assert_eq!(r.provided_check_digit, 1);
        assert_eq!(r.corrected, "4111111111111111");
    }

    #[test]
    fn flags_a_mistyped_digit_and_suggests_a_fix() {
        let r = analyze("4111-1111-1111-1112").unwrap();
        assert!(!r.valid);
        assert_eq!(r.expected_check_digit, 1);
        assert_eq!(r.provided_check_digit, 2);
        assert_eq!(r.corrected, "4111111111111111");
    }

    #[test]
    fn computes_a_known_check_digit() {
        // "742617155399" + check digit 3 → 7426171553993.
        let prefix: Vec<u32> = "742617155399"
            .chars()
            .filter_map(|c| c.to_digit(10))
            .collect();
        assert_eq!(compute_check_digit(&prefix), 3);
    }

    #[test]
    fn rejects_input_with_too_few_digits() {
        assert!(analyze("7").is_err());
        assert!(analyze("abc").is_err());
    }
}
