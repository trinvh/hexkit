//! Headless entry point over `devtools-core`, shared by the `hexkit` binary.

use devtools_core::{ToolError, ToolResult};
use serde_json::Value;

/// Run an action with optional JSON params and format the result.
///
/// The action may be a plain id (`"base64.encode"`) or a `hexkit://` deep link.
/// String results are returned raw; structured results as pretty JSON.
pub fn execute(action: &str, params_json: Option<&str>) -> ToolResult<String> {
    let result = if action.starts_with("hexkit://") {
        let (act, params) = devtools_core::parse_deep_link(action)?;
        devtools_core::run(&act, params)?
    } else {
        devtools_core::run(action, parse_params(params_json)?)?
    };
    Ok(format_output(&result))
}

fn parse_params(params_json: Option<&str>) -> ToolResult<Value> {
    match params_json {
        Some(raw) if !raw.trim().is_empty() => serde_json::from_str(raw)
            .map_err(|e| ToolError::invalid_input(format!("invalid params JSON: {e}"))),
        _ => Ok(Value::Object(serde_json::Map::new())),
    }
}

fn format_output(value: &Value) -> String {
    match value {
        Value::String(text) => text.clone(),
        other => serde_json::to_string_pretty(other).unwrap_or_else(|_| other.to_string()),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn runs_a_string_action() {
        assert_eq!(
            execute("base64.encode", Some(r#"{"input":"hi"}"#)).unwrap(),
            "aGk=",
        );
    }

    #[test]
    fn pretty_prints_structured_results() {
        let out = execute("case.convert", Some(r#"{"input":"hello world"}"#)).unwrap();
        assert!(out.contains("\"snake\": \"hello_world\""));
    }

    #[test]
    fn runs_a_deep_link_argument() {
        assert_eq!(execute("hexkit://base64.encode?input=hi", None).unwrap(), "aGk=");
    }

    #[test]
    fn propagates_tool_errors() {
        assert!(matches!(
            execute("base64.decode", Some(r#"{"input":"@@@@"}"#)),
            Err(ToolError::InvalidInput(_))
        ));
    }

    #[test]
    fn rejects_invalid_params_json() {
        assert!(matches!(
            execute("base64.encode", Some("not json")),
            Err(ToolError::InvalidInput(_))
        ));
    }

    #[test]
    fn rejects_unknown_action() {
        assert!(matches!(
            execute("bogus.action", Some("{}")),
            Err(ToolError::InvalidInput(_))
        ));
    }
}
