//! TOML <-> JSON / YAML conversion.

use crate::error::{ToolError, ToolResult};
use serde::Deserialize;
use serde_json::Value;

/// Convert TOML text to pretty-printed JSON.
pub fn to_json(input: &str) -> ToolResult<String> {
    let value: Value = toml::from_str(input).map_err(|e| ToolError::invalid_input(e.to_string()))?;
    serde_json::to_string_pretty(&value).map_err(|e| ToolError::other(e.to_string()))
}

/// Convert JSON text to TOML.
pub fn from_json(input: &str) -> ToolResult<String> {
    let value: Value =
        serde_json::from_str(input).map_err(|e| ToolError::invalid_input(e.to_string()))?;
    toml::to_string_pretty(&value).map_err(|e| ToolError::invalid_input(e.to_string()))
}

/// Convert TOML text to YAML.
pub fn to_yaml(input: &str) -> ToolResult<String> {
    let value: Value = toml::from_str(input).map_err(|e| ToolError::invalid_input(e.to_string()))?;
    serde_yaml_ng::to_string(&value).map_err(|e| ToolError::other(e.to_string()))
}

/// Convert YAML text to TOML.
pub fn from_yaml(input: &str) -> ToolResult<String> {
    let value: Value =
        serde_yaml_ng::from_str(input).map_err(|e| ToolError::invalid_input(e.to_string()))?;
    toml::to_string_pretty(&value).map_err(|e| ToolError::invalid_input(e.to_string()))
}

#[derive(Deserialize)]
struct OneInput {
    input: String,
}

pub fn dispatch(action: &str, params: Value) -> ToolResult<Value> {
    let parsed: OneInput =
        serde_json::from_value(params).map_err(|e| ToolError::invalid_input(e.to_string()))?;
    match action {
        "toml.to_json" => Ok(Value::String(to_json(&parsed.input)?)),
        "toml.from_json" => Ok(Value::String(from_json(&parsed.input)?)),
        "toml.to_yaml" => Ok(Value::String(to_yaml(&parsed.input)?)),
        "toml.from_yaml" => Ok(Value::String(from_yaml(&parsed.input)?)),
        _ => Err(ToolError::invalid_input(format!("unknown action: {action}"))),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn toml_to_json() {
        let json = to_json("name = \"hexkit\"\nversion = 1").unwrap();
        assert!(json.contains("\"name\": \"hexkit\""));
        assert!(json.contains("\"version\": 1"));
    }

    #[test]
    fn json_to_toml() {
        let toml = from_json(r#"{"name":"hexkit","version":1}"#).unwrap();
        assert!(toml.contains("name = \"hexkit\""));
        assert!(toml.contains("version = 1"));
    }

    #[test]
    fn toml_to_yaml() {
        let yaml = to_yaml("name = \"hexkit\"\nversion = 1").unwrap();
        assert!(yaml.contains("name: hexkit"));
        assert!(yaml.contains("version: 1"));
    }

    #[test]
    fn yaml_to_toml() {
        let toml = from_yaml("name: hexkit\nversion: 1").unwrap();
        assert!(toml.contains("name = \"hexkit\""));
        assert!(toml.contains("version = 1"));
    }

    #[test]
    fn round_trips_through_json() {
        let json = to_json("name = \"hexkit\"\ntags = [\"a\", \"b\"]").unwrap();
        let toml = from_json(&json).unwrap();
        assert!(toml.contains("name = \"hexkit\""));
        // toml::to_string_pretty may format the array multi-line; just assert
        // both elements round-tripped.
        assert!(toml.contains("\"a\""));
        assert!(toml.contains("\"b\""));
    }

    #[test]
    fn rejects_invalid_toml() {
        assert!(matches!(to_json("not = "), Err(ToolError::InvalidInput(_))));
    }

    #[test]
    fn rejects_invalid_json() {
        assert!(matches!(from_json("{bad}"), Err(ToolError::InvalidInput(_))));
    }

    #[test]
    fn rejects_invalid_yaml() {
        assert!(matches!(
            from_yaml("key: : :"),
            Err(ToolError::InvalidInput(_))
        ));
    }
}
