//! Uniform action dispatcher: the single entry point shared by every adapter
//! (Tauri commands, the headless CLI, and the `hexkit://` deep-link handler).
//!
//! An action id is namespaced as `"<tool>.<verb>"` (e.g. `"json.format"`).
//! Params and results are JSON values so external callers need no Rust types.

use crate::error::{ToolError, ToolResult};
use serde_json::Value;

/// Run an action by id with JSON `params`, returning a JSON result.
///
/// Returns [`ToolError::InvalidInput`] for unknown actions, ids without a
/// `<tool>.<verb>` namespace, or params that fail to deserialize. Tool-specific
/// failures propagate unchanged.
pub fn run(action: &str, params: Value) -> ToolResult<Value> {
    let (namespace, _verb) = action
        .split_once('.')
        .ok_or_else(|| ToolError::invalid_input(format!("malformed action id: {action}")))?;

    match namespace {
        "json" => crate::json::dispatch(action, params),
        "base64" => crate::base64::dispatch(action, params),
        "url" => crate::urls::dispatch(action, params),
        "html" => crate::html::dispatch(action, params),
        "number" => crate::numbase::dispatch(action, params),
        "case" => crate::textcase::dispatch(action, params),
        "time" => crate::unixtime::dispatch(action, params),
        "hash" => crate::hash::dispatch(action, params),
        "id" => crate::ids::dispatch(action, params),
        "diff" => crate::textdiff::dispatch(action, params),
        "jwt" => crate::jwt::dispatch(action, params),
        "detect" => crate::detect::dispatch(action, params),
        _ => Err(ToolError::invalid_input(format!("unknown action: {action}"))),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn dispatches_json_format() {
        let out = run("json.format", json!({ "input": "{\"a\":1}", "indent": "  " })).unwrap();
        assert_eq!(out, json!("{\n  \"a\": 1\n}"));
    }

    #[test]
    fn dispatches_json_minify() {
        let out = run("json.minify", json!({ "input": "{ \"a\": 1 }" })).unwrap();
        assert_eq!(out, json!("{\"a\":1}"));
    }

    #[test]
    fn unknown_verb_in_known_namespace_is_invalid_input() {
        let err = run("json.nope", json!({})).unwrap_err();
        assert!(matches!(err, ToolError::InvalidInput(_)));
    }

    #[test]
    fn unknown_namespace_is_invalid_input() {
        let err = run("bogus.thing", json!({})).unwrap_err();
        assert!(matches!(err, ToolError::InvalidInput(_)));
    }

    #[test]
    fn action_without_namespace_is_invalid_input() {
        let err = run("noseparator", json!({})).unwrap_err();
        assert!(matches!(err, ToolError::InvalidInput(_)));
    }

    #[test]
    fn missing_params_field_is_invalid_input() {
        // `indent` is required by json.format.
        let err = run("json.format", json!({ "input": "{}" })).unwrap_err();
        assert!(matches!(err, ToolError::InvalidInput(_)));
    }

    #[test]
    fn propagates_tool_errors() {
        let err = run("json.format", json!({ "input": "{bad}", "indent": "  " })).unwrap_err();
        assert!(matches!(err, ToolError::InvalidInput(_)));
    }
}
