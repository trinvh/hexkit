//! SQL formatting.

use crate::error::{ToolError, ToolResult};
use serde::Deserialize;
use serde_json::Value;
use sqlformat::{FormatOptions, QueryParams};

/// Reformat a SQL query for readability.
pub fn format(input: &str) -> ToolResult<String> {
    let trimmed = input.trim();
    if trimmed.is_empty() {
        return Err(ToolError::invalid_input("input is empty"));
    }
    Ok(sqlformat::format(
        trimmed,
        &QueryParams::None,
        &FormatOptions::default(),
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
        "sql.format" => Ok(Value::String(format(&parsed.input)?)),
        _ => Err(ToolError::invalid_input(format!("unknown action: {action}"))),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn formats_a_query_across_lines() {
        let out = format("select a,b from t where x=1").unwrap();
        assert!(out.contains('\n'));
        assert!(out.to_lowercase().contains("from"));
    }

    #[test]
    fn rejects_empty_input() {
        assert!(matches!(format("   "), Err(ToolError::InvalidInput(_))));
    }
}
