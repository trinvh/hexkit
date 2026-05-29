//! Cron expression parsing and upcoming-run computation.

use crate::error::{ToolError, ToolResult};
use chrono::Utc;
use saffron::Cron;
use serde::{Deserialize, Serialize};
use serde_json::Value;

#[derive(Debug, Serialize, PartialEq, Eq)]
pub struct CronInfo {
    /// Next run times as RFC 3339 strings (UTC), starting from now.
    pub next_runs: Vec<String>,
}

/// Parse a 5-field cron expression and compute its next 5 run times.
pub fn parse(expr: &str) -> ToolResult<CronInfo> {
    let cron: Cron = expr
        .trim()
        .parse()
        .map_err(|_| ToolError::invalid_input("invalid cron expression"))?;

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

    Ok(CronInfo { next_runs })
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
}
