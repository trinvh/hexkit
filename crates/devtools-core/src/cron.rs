//! Cron expression parsing, description, field breakdown, and next-run computation.

use crate::error::{ToolError, ToolResult};
use chrono::Utc;
use saffron::Cron;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::collections::BTreeSet;

#[derive(Debug, Serialize, PartialEq, Eq)]
pub struct CronInfo {
    /// Human-readable summary, e.g. "Every 5 minutes".
    pub description: String,
    /// Expanded minutes (or "(All)").
    pub minutes: String,
    pub hours: String,
    pub day_of_month: String,
    pub months: String,
    pub day_of_week: String,
    /// Next run times as RFC 3339 strings (UTC), starting from now.
    pub next_runs: Vec<String>,
}

const MONTHS: [&str; 12] = [
    "January", "February", "March", "April", "May", "June", "July", "August",
    "September", "October", "November", "December",
];
const DAYS: [&str; 7] = [
    "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday",
];

/// Parse a 5-field cron expression and compute its description, field
/// breakdown, and next 5 run times.
pub fn parse(expr: &str) -> ToolResult<CronInfo> {
    let cron: Cron = expr
        .trim()
        .parse()
        .map_err(|_| ToolError::invalid_input("invalid cron expression"))?;

    let fields: Vec<&str> = expr.split_whitespace().collect();
    let [min, hour, dom, mon, dow] = <[&str; 5]>::try_from(fields.as_slice())
        .map_err(|_| ToolError::invalid_input("a cron expression needs 5 fields"))?;

    let mut next_runs = Vec::new();
    let mut from = Utc::now();
    for _ in 0..5 {
        match cron.next_after(from) {
            Some(next) => {
                next_runs.push(next.to_rfc3339());
                from = next;
            }
            None => break,
        }
    }

    Ok(CronInfo {
        description: describe(min, hour, dom, mon, dow),
        minutes: format_field(min, 0, 59, FieldStyle::Minute),
        hours: format_field(hour, 0, 23, FieldStyle::Hour),
        day_of_month: format_field(dom, 1, 31, FieldStyle::Number),
        months: format_field(mon, 1, 12, FieldStyle::Month),
        day_of_week: format_field(dow, 0, 6, FieldStyle::Weekday),
        next_runs,
    })
}

#[derive(Clone, Copy)]
enum FieldStyle {
    Minute,
    Hour,
    Number,
    Month,
    Weekday,
}

fn format_field(field: &str, min: u32, max: u32, style: FieldStyle) -> String {
    if field == "*" {
        return "(All)".to_string();
    }
    match expand(field, min, max) {
        Some(values) => values
            .iter()
            .map(|&v| render_value(v, style))
            .collect::<Vec<_>>()
            .join(", "),
        // Names (MON-FRI) or other forms we don't expand: show as written.
        None => field.to_string(),
    }
}

fn render_value(v: u32, style: FieldStyle) -> String {
    match style {
        FieldStyle::Minute => format!(":{v:02}"),
        FieldStyle::Hour => format!("{v:02}"),
        FieldStyle::Number => v.to_string(),
        FieldStyle::Month => MONTHS
            .get((v as usize).wrapping_sub(1))
            .map_or_else(|| v.to_string(), |s| s.to_string()),
        FieldStyle::Weekday => DAYS
            .get((v % 7) as usize)
            .map_or_else(|| v.to_string(), |s| s.to_string()),
    }
}

/// Expand a numeric cron field into its sorted set of values. Returns `None`
/// when the field uses names or a form we don't expand.
fn expand(field: &str, min: u32, max: u32) -> Option<Vec<u32>> {
    let mut set = BTreeSet::new();
    for part in field.split(',') {
        let (range, step) = match part.split_once('/') {
            Some((r, s)) => (r, s.parse::<u32>().ok()?),
            None => (part, 1),
        };
        if step == 0 {
            return None;
        }
        let (start, end) = if range == "*" {
            (min, max)
        } else if let Some((a, b)) = range.split_once('-') {
            (a.parse().ok()?, b.parse().ok()?)
        } else {
            let v: u32 = range.parse().ok()?;
            if step == 1 {
                (v, v)
            } else {
                (v, max)
            }
        };
        if start > end || end > max {
            return None;
        }
        let mut value = start;
        while value <= end {
            set.insert(value);
            value += step;
        }
    }
    Some(set.into_iter().collect())
}

fn single(field: &str) -> Option<u32> {
    field.parse::<u32>().ok()
}

fn every_n(field: &str) -> Option<u32> {
    field.strip_prefix("*/").and_then(|s| s.parse::<u32>().ok())
}

fn describe(min: &str, hour: &str, dom: &str, mon: &str, dow: &str) -> String {
    let mut text = describe_time(min, hour);
    if dom != "*" {
        text.push_str(&format!(" on day {dom} of the month"));
    }
    if dow != "*" {
        if let Some(values) = expand(dow, 0, 6) {
            let names: Vec<String> = values
                .iter()
                .map(|&v| render_value(v, FieldStyle::Weekday))
                .collect();
            text.push_str(&format!(" on {}", names.join(", ")));
        } else {
            text.push_str(&format!(" on {dow}"));
        }
    }
    if mon != "*" {
        if let Some(values) = expand(mon, 1, 12) {
            let names: Vec<String> = values
                .iter()
                .map(|&v| render_value(v, FieldStyle::Month))
                .collect();
            text.push_str(&format!(" in {}", names.join(", ")));
        } else {
            text.push_str(&format!(" in month {mon}"));
        }
    }
    capitalize(&text)
}

fn describe_time(min: &str, hour: &str) -> String {
    match (min, hour) {
        ("*", "*") => "every minute".to_string(),
        _ if hour == "*" => {
            if let Some(n) = every_n(min) {
                format!("every {n} minutes")
            } else if let Some(m) = single(min) {
                format!("at {m} minutes past every hour")
            } else {
                format!("at minutes {min} of every hour")
            }
        }
        _ => match (single(min), single(hour)) {
            (Some(m), Some(h)) => format!("at {h:02}:{m:02}"),
            _ => format!("at minute {min} of hour {hour}"),
        },
    }
}

fn capitalize(s: &str) -> String {
    let mut chars = s.chars();
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
        "cron.parse" => {
            serde_json::to_value(parse(&parsed.input)?).map_err(|e| ToolError::other(e.to_string()))
        }
        _ => Err(ToolError::invalid_input(format!("unknown action: {action}"))),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn computes_upcoming_runs_for_daily() {
        let info = parse("0 0 * * *").unwrap();
        assert_eq!(info.next_runs.len(), 5);
    }

    #[test]
    fn upcoming_runs_are_strictly_increasing() {
        let info = parse("*/5 * * * *").unwrap();
        for window in info.next_runs.windows(2) {
            assert!(window[0] < window[1]);
        }
    }

    #[test]
    fn rejects_invalid_expression() {
        assert!(matches!(parse("not a cron"), Err(ToolError::InvalidInput(_))));
    }

    #[test]
    fn describes_every_n_minutes_and_expands_fields() {
        let info = parse("*/5 * * * *").unwrap();
        assert_eq!(info.description, "Every 5 minutes");
        assert_eq!(
            info.minutes,
            ":00, :05, :10, :15, :20, :25, :30, :35, :40, :45, :50, :55"
        );
        assert_eq!(info.hours, "(All)");
        assert_eq!(info.day_of_month, "(All)");
        assert_eq!(info.months, "(All)");
        assert_eq!(info.day_of_week, "(All)");
    }

    #[test]
    fn describes_weekday_schedule() {
        let info = parse("0 9 * * 1-5").unwrap();
        assert!(info.description.contains("09:00"));
        assert!(info.description.contains("Monday"));
        assert_eq!(info.minutes, ":00");
        assert_eq!(info.hours, "09");
        assert_eq!(
            info.day_of_week,
            "Monday, Tuesday, Wednesday, Thursday, Friday"
        );
    }

    #[test]
    fn expands_month_and_day_of_month() {
        let info = parse("0 0 1 1 *").unwrap();
        assert_eq!(info.day_of_month, "1");
        assert_eq!(info.months, "January");
    }

    #[test]
    fn describes_every_minute() {
        assert_eq!(parse("* * * * *").unwrap().description, "Every minute");
    }
}
