//! Unix timestamp <-> human date conversion.

use crate::error::{ToolError, ToolResult};
use jiff::tz::TimeZone;
use jiff::{Timestamp, Zoned};
use serde::{Deserialize, Serialize};
use serde_json::Value;

#[derive(Debug, Serialize, PartialEq, Eq)]
pub struct TimeInfo {
    pub epoch_seconds: String,
    pub epoch_millis: String,
    pub iso8601: String,
    pub utc: String,
    pub local: String,
    pub day_of_week: String,
    /// Human-friendly distance from now, e.g. "3 minutes ago" / "in 2 hours".
    pub relative: String,
    /// Day of the year, 1-366.
    pub day_of_year: String,
    /// ISO week of the year, 1-53.
    pub week_of_year: String,
    /// Whether the (UTC) year is a leap year.
    pub is_leap_year: bool,
    /// RFC 2822 representation, e.g. "Tue, 14 Nov 2023 22:13:20 +0000".
    pub rfc2822: String,
}

/// Convert `input` (a Unix timestamp in seconds or milliseconds, an
/// RFC 3339 / ISO date string, or a simple arithmetic expression of epoch
/// seconds like `1700000000 + 3600`) into human-readable representations.
pub fn convert(input: &str) -> ToolResult<TimeInfo> {
    let timestamp = parse(input)?;
    let utc = timestamp.to_zoned(TimeZone::UTC);
    let local = timestamp.to_zoned(TimeZone::system());
    let year = utc.year();
    Ok(TimeInfo {
        epoch_seconds: timestamp.as_second().to_string(),
        epoch_millis: timestamp.as_millisecond().to_string(),
        iso8601: timestamp.to_string(),
        utc: utc.strftime("%Y-%m-%d %H:%M:%S UTC").to_string(),
        local: local.strftime("%Y-%m-%d %H:%M:%S %Z").to_string(),
        day_of_week: utc.strftime("%A").to_string(),
        relative: relative_to_now(timestamp),
        day_of_year: utc.day_of_year().to_string(),
        week_of_year: utc.strftime("%V").to_string().trim_start_matches('0').to_string(),
        is_leap_year: is_leap_year(year),
        rfc2822: utc.strftime("%a, %d %b %Y %H:%M:%S %z").to_string(),
    })
}

fn is_leap_year(year: i16) -> bool {
    (year % 4 == 0 && year % 100 != 0) || year % 400 == 0
}

/// Format the distance between `timestamp` and the current instant in the
/// largest sensible unit, e.g. "5 minutes ago" or "in 3 hours".
fn relative_to_now(timestamp: Timestamp) -> String {
    let now = Timestamp::now().as_second();
    let diff = now - timestamp.as_second();
    let past = diff >= 0;
    let secs = diff.unsigned_abs();
    let (value, unit) = match secs {
        0 => return "just now".to_string(),
        s if s < 60 => (s, "second"),
        s if s < 3_600 => (s / 60, "minute"),
        s if s < 86_400 => (s / 3_600, "hour"),
        s if s < 2_592_000 => (s / 86_400, "day"),
        s if s < 31_536_000 => (s / 2_592_000, "month"),
        s => (s / 31_536_000, "year"),
    };
    let plural = if value == 1 { "" } else { "s" };
    if past {
        format!("{value} {unit}{plural} ago")
    } else {
        format!("in {value} {unit}{plural}")
    }
}

/// Evaluate a simple `+ - * /` expression of integers with normal precedence.
/// Returns `None` when the input is not an arithmetic expression (so a lone
/// number still parses as a timestamp).
fn eval_arithmetic(input: &str) -> Option<i64> {
    let tokens: Vec<&str> = input.split_whitespace().collect();
    if tokens.len() < 3 || tokens.len().is_multiple_of(2) {
        return None;
    }
    let mut numbers = Vec::new();
    let mut operators = Vec::new();
    for (i, token) in tokens.iter().enumerate() {
        if i % 2 == 0 {
            numbers.push(token.parse::<i64>().ok()?);
        } else if matches!(*token, "+" | "-" | "*" | "/") {
            operators.push(*token);
        } else {
            return None;
        }
    }

    // First pass: fold `*` and `/` to honour precedence.
    let mut folded = vec![numbers[0]];
    let mut add_ops = Vec::new();
    for (i, op) in operators.iter().enumerate() {
        let rhs = numbers[i + 1];
        match *op {
            "*" => {
                let last = folded.last_mut().unwrap();
                *last = last.checked_mul(rhs)?;
            }
            "/" => {
                if rhs == 0 {
                    return None;
                }
                let last = folded.last_mut().unwrap();
                *last /= rhs;
            }
            other => {
                add_ops.push(other);
                folded.push(rhs);
            }
        }
    }

    // Second pass: fold `+` and `-`.
    let mut acc = folded[0];
    for (i, op) in add_ops.iter().enumerate() {
        let rhs = folded[i + 1];
        acc = match *op {
            "+" => acc.checked_add(rhs)?,
            "-" => acc.checked_sub(rhs)?,
            _ => return None,
        };
    }
    Some(acc)
}

fn parse(input: &str) -> ToolResult<Timestamp> {
    let trimmed = input.trim();
    if trimmed.is_empty() {
        return Err(ToolError::invalid_input("input is empty"));
    }

    if let Some(seconds) = eval_arithmetic(trimmed) {
        return Timestamp::from_second(seconds)
            .map_err(|e| ToolError::invalid_input(e.to_string()));
    }

    if let Ok(number) = trimmed.parse::<i64>() {
        let result = if number.abs() >= 1_000_000_000_000 {
            Timestamp::from_millisecond(number)
        } else {
            Timestamp::from_second(number)
        };
        return result.map_err(|e| ToolError::invalid_input(e.to_string()));
    }

    if let Ok(timestamp) = trimmed.parse::<Timestamp>() {
        return Ok(timestamp);
    }
    if let Ok(zoned) = trimmed.parse::<Zoned>() {
        return Ok(zoned.timestamp());
    }
    Err(ToolError::invalid_input(
        "could not parse as a Unix timestamp or date",
    ))
}

#[derive(Deserialize)]
struct OneInput {
    input: String,
}

pub fn dispatch(action: &str, params: Value) -> ToolResult<Value> {
    let parsed: OneInput =
        serde_json::from_value(params).map_err(|e| ToolError::invalid_input(e.to_string()))?;
    match action {
        "time.convert" => {
            serde_json::to_value(convert(&parsed.input)?)
                .map_err(|e| ToolError::other(e.to_string()))
        }
        _ => Err(ToolError::invalid_input(format!("unknown action: {action}"))),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn converts_epoch_zero() {
        let info = convert("0").unwrap();
        assert_eq!(info.epoch_seconds, "0");
        assert_eq!(info.epoch_millis, "0");
        assert_eq!(info.iso8601, "1970-01-01T00:00:00Z");
        assert_eq!(info.utc, "1970-01-01 00:00:00 UTC");
        assert_eq!(info.day_of_week, "Thursday");
    }

    #[test]
    fn converts_epoch_seconds() {
        let info = convert("1700000000").unwrap();
        assert_eq!(info.epoch_seconds, "1700000000");
        assert_eq!(info.iso8601, "2023-11-14T22:13:20Z");
        assert_eq!(info.day_of_week, "Tuesday");
    }

    #[test]
    fn treats_large_values_as_milliseconds() {
        let info = convert("1700000000000").unwrap();
        assert_eq!(info.epoch_seconds, "1700000000");
        assert_eq!(info.epoch_millis, "1700000000000");
    }

    #[test]
    fn parses_rfc3339_string() {
        let info = convert("2023-11-14T22:13:20Z").unwrap();
        assert_eq!(info.epoch_seconds, "1700000000");
    }

    #[test]
    fn rejects_empty_input() {
        assert!(matches!(convert("  "), Err(ToolError::InvalidInput(_))));
    }

    #[test]
    fn rejects_unparseable_input() {
        assert!(matches!(convert("not a date"), Err(ToolError::InvalidInput(_))));
    }

    #[test]
    fn reports_day_and_week_of_year() {
        // 2023-11-14 is the 318th day of the year.
        let info = convert("1700000000").unwrap();
        assert_eq!(info.day_of_year, "318");
        // Week number should be a parseable 1..=53.
        let week: u32 = info.week_of_year.parse().unwrap();
        assert!((1..=53).contains(&week), "unexpected week: {week}");
    }

    #[test]
    fn reports_leap_year_flag() {
        // 2020 is a leap year, 2023 is not.
        let leap = convert("2020-06-01T00:00:00Z").unwrap();
        assert!(leap.is_leap_year);
        let common = convert("2023-06-01T00:00:00Z").unwrap();
        assert!(!common.is_leap_year);
    }

    #[test]
    fn includes_a_relative_description() {
        // Epoch zero is decades in the past.
        let info = convert("0").unwrap();
        assert!(
            info.relative.contains("ago"),
            "relative should be in the past: {}",
            info.relative
        );
    }

    #[test]
    fn includes_rfc2822_format() {
        let info = convert("1700000000").unwrap();
        assert!(
            info.rfc2822.contains("14 Nov 2023"),
            "unexpected rfc2822: {}",
            info.rfc2822
        );
    }

    #[test]
    fn evaluates_addition_and_subtraction() {
        assert_eq!(convert("100 + 50").unwrap().epoch_seconds, "150");
        assert_eq!(convert("100 - 30").unwrap().epoch_seconds, "70");
    }

    #[test]
    fn evaluates_with_operator_precedence() {
        // 2 + 3 * 4 = 14, not 20.
        assert_eq!(convert("2 + 3 * 4").unwrap().epoch_seconds, "14");
        assert_eq!(convert("100 / 4").unwrap().epoch_seconds, "25");
    }

    #[test]
    fn plain_numbers_are_not_treated_as_arithmetic() {
        // A lone timestamp must still parse as a timestamp, not an expression.
        assert_eq!(convert("1700000000").unwrap().epoch_seconds, "1700000000");
    }
}
