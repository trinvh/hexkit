//! Generate Luhn-valid TEST credit card numbers for software development.
//!
//! ⚠️  These numbers are NOT real cards. They pass Luhn validation only.
//! They must never be used to attempt a real payment.

use crate::error::{ToolError, ToolResult};
use crate::luhn;
use rand::{Rng, RngExt};
use serde::{Deserialize, Serialize};
use serde_json::Value;

#[derive(Debug, Clone, Copy, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum Brand {
    Visa,
    Mastercard,
    Amex,
    Discover,
    Jcb,
    Diners,
    UnionPay,
}

impl Brand {
    fn display(self) -> &'static str {
        match self {
            Brand::Visa => "Visa",
            Brand::Mastercard => "Mastercard",
            Brand::Amex => "American Express",
            Brand::Discover => "Discover",
            Brand::Jcb => "JCB",
            Brand::Diners => "Diners Club",
            Brand::UnionPay => "UnionPay",
        }
    }
}

#[derive(Debug, Serialize, PartialEq, Eq)]
pub struct GeneratedCard {
    /// Raw digits, no separators.
    pub number: String,
    /// Human-friendly grouping ("4111 1111 1111 1111", "3782 822463 10005", …).
    pub formatted: String,
    pub brand: String,
}

pub fn generate(brand: Brand, count: usize) -> ToolResult<Vec<GeneratedCard>> {
    if !(1..=200).contains(&count) {
        return Err(ToolError::invalid_input("count must be between 1 and 200"));
    }
    let mut rng = rand::rng();
    Ok((0..count).map(|_| generate_one(&mut rng, brand)).collect())
}

fn generate_one(rng: &mut impl Rng, brand: Brand) -> GeneratedCard {
    let (prefix, length) = pick_iin(rng, brand);
    let mut digits = prefix;
    while digits.len() < length - 1 {
        digits.push(char::from_digit(rng.random_range(0..10), 10).unwrap());
    }
    let prefix_digits: Vec<u32> = digits.chars().filter_map(|c| c.to_digit(10)).collect();
    let check = luhn::compute_check_digit(&prefix_digits);
    digits.push(char::from_digit(check, 10).unwrap());

    GeneratedCard {
        formatted: format_groups(&digits, brand),
        brand: brand.display().to_string(),
        number: digits,
    }
}

/// Pick a brand-appropriate Issuer Identification Number prefix and the final
/// PAN length, biased toward each brand's most common ranges.
fn pick_iin(rng: &mut impl Rng, brand: Brand) -> (String, usize) {
    match brand {
        Brand::Visa => ("4".to_string(), 16),
        Brand::Mastercard => {
            // 51-55 (classic) or 2221-2720 (extended) ranges.
            if rng.random::<bool>() {
                (format!("{}", 51 + rng.random_range(0..5)), 16)
            } else {
                (format!("{}", 2221 + rng.random_range(0..500)), 16)
            }
        }
        Brand::Amex => {
            let prefix = if rng.random::<bool>() { "34" } else { "37" };
            (prefix.to_string(), 15)
        }
        Brand::Discover => {
            let prefix = if rng.random::<bool>() { "6011" } else { "65" };
            (prefix.to_string(), 16)
        }
        Brand::Jcb => (format!("{}", 3528 + rng.random_range(0..62)), 16),
        Brand::Diners => match rng.random_range(0..3) {
            0 => (format!("{}", 300 + rng.random_range(0..6)), 14),
            1 => ("36".to_string(), 14),
            _ => ("38".to_string(), 14),
        },
        Brand::UnionPay => ("62".to_string(), 16),
    }
}

fn format_groups(digits: &str, brand: Brand) -> String {
    let groups: &[usize] = match brand {
        Brand::Amex => &[4, 6, 5],       // 15 digits → 4-6-5
        Brand::Diners => &[4, 6, 4],     // 14 digits → 4-6-4
        _ => &[4, 4, 4, 4],              // 16 digits → 4-4-4-4
    };
    let mut out = String::with_capacity(digits.len() + groups.len());
    let mut cursor = 0;
    for (i, &len) in groups.iter().enumerate() {
        if i > 0 {
            out.push(' ');
        }
        let end = (cursor + len).min(digits.len());
        out.push_str(&digits[cursor..end]);
        cursor = end;
        if cursor >= digits.len() {
            break;
        }
    }
    if cursor < digits.len() {
        out.push_str(&digits[cursor..]);
    }
    out
}

pub fn dispatch(action: &str, params: Value) -> ToolResult<Value> {
    #[derive(Deserialize)]
    struct In {
        brand: Brand,
        #[serde(default = "default_count")]
        count: usize,
    }
    fn default_count() -> usize {
        1
    }
    let p: In = serde_json::from_value(params)
        .map_err(|e| ToolError::invalid_input(e.to_string()))?;
    match action {
        "card.generate" => serde_json::to_value(generate(p.brand, p.count)?)
            .map_err(|e| ToolError::other(e.to_string())),
        _ => Err(ToolError::invalid_input(format!("unknown action: {action}"))),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::luhn::analyze;

    #[test]
    fn generated_visa_passes_luhn_and_has_correct_length() {
        for card in generate(Brand::Visa, 5).unwrap() {
            assert_eq!(card.number.len(), 16);
            assert!(card.number.starts_with('4'));
            assert!(analyze(&card.number).unwrap().valid);
            assert_eq!(card.brand, "Visa");
        }
    }

    #[test]
    fn generated_amex_is_15_digits_starting_with_34_or_37() {
        for card in generate(Brand::Amex, 5).unwrap() {
            assert_eq!(card.number.len(), 15);
            let p = &card.number[..2];
            assert!(p == "34" || p == "37", "got prefix {p}");
            assert!(analyze(&card.number).unwrap().valid);
        }
    }

    #[test]
    fn generated_mastercard_passes_luhn_in_either_range() {
        for card in generate(Brand::Mastercard, 10).unwrap() {
            assert_eq!(card.number.len(), 16);
            assert!(analyze(&card.number).unwrap().valid);
            let first = card.number.as_bytes()[0];
            assert!(first == b'5' || first == b'2', "got first byte {first}");
        }
    }

    #[test]
    fn rejects_out_of_range_count() {
        assert!(generate(Brand::Visa, 0).is_err());
        assert!(generate(Brand::Visa, 201).is_err());
    }
}
