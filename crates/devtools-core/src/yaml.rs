//! YAML <-> JSON conversion.

use crate::error::{ToolError, ToolResult};
use serde::Deserialize;
use serde_json::Value;

/// Convert YAML text to pretty-printed JSON.
pub fn to_json(input: &str) -> ToolResult<String> {
    let value: Value = serde_yaml_ng::from_str(input)
        .map_err(|e| ToolError::invalid_input(e.to_string()))?;
    serde_json::to_string_pretty(&value).map_err(|e| ToolError::other(e.to_string()))
}

/// Convert JSON text to YAML.
pub fn from_json(input: &str) -> ToolResult<String> {
    let value: Value =
        serde_json::from_str(input).map_err(|e| ToolError::invalid_input(e.to_string()))?;
    serde_yaml_ng::to_string(&value).map_err(|e| ToolError::other(e.to_string()))
}

#[derive(Deserialize)]
struct OneInput {
    input: String,
}

pub fn dispatch(action: &str, params: Value) -> ToolResult<Value> {
    let parsed: OneInput =
        serde_json::from_value(params).map_err(|e| ToolError::invalid_input(e.to_string()))?;
    match action {
        "yaml.to_json" => Ok(Value::String(to_json(&parsed.input)?)),
        "yaml.from_json" => Ok(Value::String(from_json(&parsed.input)?)),
        _ => Err(ToolError::invalid_input(format!("unknown action: {action}"))),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn yaml_to_json() {
        let json = to_json("a: 1\nb:\n  - 1\n  - 2").unwrap();
        assert!(json.contains("\"a\": 1"));
        assert!(json.contains("\"b\""));
    }

    #[test]
    fn json_to_yaml() {
        assert_eq!(from_json(r#"{"a":1}"#).unwrap(), "a: 1\n");
    }

    #[test]
    fn round_trips_through_json() {
        let yaml = from_json(r#"{"name":"hexkit","tags":["a","b"]}"#).unwrap();
        let json = to_json(&yaml).unwrap();
        assert!(json.contains("\"name\": \"hexkit\""));
    }

    #[test]
    fn rejects_invalid_json() {
        assert!(matches!(from_json("{bad}"), Err(ToolError::InvalidInput(_))));
    }
}
