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
}

/// Convert `input` (a Unix timestamp in seconds or milliseconds, or an
/// RFC 3339 / ISO date string) into a set of human-readable representations.
pub fn convert(input: &str) -> ToolResult<TimeInfo> {
    let timestamp = parse(input)?;
    let utc = timestamp.to_zoned(TimeZone::UTC);
    let local = timestamp.to_zoned(TimeZone::system());
    Ok(TimeInfo {
        epoch_seconds: timestamp.as_second().to_string(),
        epoch_millis: timestamp.as_millisecond().to_string(),
        iso8601: timestamp.to_string(),
        utc: utc.strftime("%Y-%m-%d %H:%M:%S UTC").to_string(),
        local: local.strftime("%Y-%m-%d %H:%M:%S %Z").to_string(),
        day_of_week: utc.strftime("%A").to_string(),
    })
}

fn parse(input: &str) -> ToolResult<Timestamp> {
    let trimmed = input.trim();
    if trimmed.is_empty() {
        return Err(ToolError::invalid_input("input is empty"));
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
}
