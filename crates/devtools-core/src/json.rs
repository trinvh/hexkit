//! JSON formatting, minification, and validation.

use crate::error::{ToolError, ToolResult};
use serde::de::DeserializeOwned;
use serde::{Deserialize, Serialize};
use serde_json::ser::{PrettyFormatter, Serializer};
use serde_json::Value;

/// Pretty-print JSON using `indent` as the indentation unit (e.g. `"  "`,
/// `"    "`, or `"\t"`). Object key order is preserved. Returns
/// [`ToolError::InvalidInput`] when the input is empty or not valid JSON.
pub fn format(input: &str, indent: &str) -> ToolResult<String> {
    let value = parse(input)?;
    let mut buf = Vec::new();
    let formatter = PrettyFormatter::with_indent(indent.as_bytes());
    let mut serializer = Serializer::with_formatter(&mut buf, formatter);
    value
        .serialize(&mut serializer)
        .map_err(|e| ToolError::other(e.to_string()))?;
    String::from_utf8(buf).map_err(|e| ToolError::other(e.to_string()))
}

/// Minify JSON to its most compact single-line form. Key order is preserved.
/// Returns [`ToolError::InvalidInput`] when the input is not valid JSON.
pub fn minify(input: &str) -> ToolResult<String> {
    let value = parse(input)?;
    serde_json::to_string(&value).map_err(|e| ToolError::other(e.to_string()))
}

fn parse(input: &str) -> ToolResult<Value> {
    let trimmed = input.trim();
    if trimmed.is_empty() {
        return Err(ToolError::invalid_input("input is empty"));
    }
    serde_json::from_str(trimmed).map_err(|e| ToolError::invalid_input(e.to_string()))
}

#[derive(Deserialize)]
struct FormatParams {
    input: String,
    indent: String,
}

#[derive(Deserialize)]
struct MinifyParams {
    input: String,
}

/// Route a `json.*` action to its pure function. Used by [`crate::actions::run`].
pub fn dispatch(action: &str, params: Value) -> ToolResult<Value> {
    match action {
        "json.format" => {
            let p: FormatParams = from_params(params)?;
            Ok(Value::String(format(&p.input, &p.indent)?))
        }
        "json.minify" => {
            let p: MinifyParams = from_params(params)?;
            Ok(Value::String(minify(&p.input)?))
        }
        _ => Err(ToolError::invalid_input(format!("unknown action: {action}"))),
    }
}

fn from_params<T: DeserializeOwned>(params: Value) -> ToolResult<T> {
    serde_json::from_value(params).map_err(|e| ToolError::invalid_input(e.to_string()))
}

#[cfg(test)]
mod tests {
    use super::*;
    use rstest::rstest;

    #[test]
    fn formats_object_with_two_space_indent() {
        let out = format(r#"{"a":1}"#, "  ").unwrap();
        assert_eq!(out, "{\n  \"a\": 1\n}");
    }

    #[rstest]
    #[case("  ", "{\n  \"a\": 1\n}")]
    #[case("    ", "{\n    \"a\": 1\n}")]
    #[case("\t", "{\n\t\"a\": 1\n}")]
    fn formats_with_configurable_indent(#[case] indent: &str, #[case] expected: &str) {
        assert_eq!(format(r#"{"a":1}"#, indent).unwrap(), expected);
    }

    #[test]
    fn preserves_object_key_order() {
        // Keys must stay in document order, not be sorted alphabetically.
        let out = format(r#"{"b":1,"a":2,"c":3}"#, "  ").unwrap();
        let b = out.find("\"b\"").unwrap();
        let a = out.find("\"a\"").unwrap();
        let c = out.find("\"c\"").unwrap();
        assert!(b < a && a < c, "key order not preserved: {out}");
    }

    #[test]
    fn formats_nested_structures_and_arrays() {
        let out = format(r#"{"list":[1,2],"obj":{"x":true}}"#, "  ").unwrap();
        assert_eq!(
            out,
            "{\n  \"list\": [\n    1,\n    2\n  ],\n  \"obj\": {\n    \"x\": true\n  }\n}"
        );
    }

    #[test]
    fn formats_scalars_and_null() {
        assert_eq!(format("42", "  ").unwrap(), "42");
        assert_eq!(format("true", "  ").unwrap(), "true");
        assert_eq!(format("null", "  ").unwrap(), "null");
        assert_eq!(format(r#""hi""#, "  ").unwrap(), "\"hi\"");
    }

    #[test]
    fn ignores_surrounding_whitespace() {
        assert_eq!(format("  \n {\"a\":1}\t ", "  ").unwrap(), "{\n  \"a\": 1\n}");
    }

    #[test]
    fn minifies_removing_insignificant_whitespace() {
        let out = minify("{\n  \"a\": 1,\n  \"b\": [1, 2]\n}").unwrap();
        assert_eq!(out, r#"{"a":1,"b":[1,2]}"#);
    }

    #[test]
    fn minify_preserves_key_order() {
        assert_eq!(minify(r#"{ "z": 1, "a": 2 }"#).unwrap(), r#"{"z":1,"a":2}"#);
    }

    #[test]
    fn rejects_empty_input() {
        assert_eq!(
            format("   ", "  "),
            Err(ToolError::invalid_input("input is empty"))
        );
        assert_eq!(
            minify(""),
            Err(ToolError::invalid_input("input is empty"))
        );
    }

    #[test]
    fn rejects_invalid_json_with_invalid_input_error() {
        let err = format(r#"{"a": }"#, "  ").unwrap_err();
        assert!(matches!(err, ToolError::InvalidInput(_)));

        let err = minify(r#"{not json}"#).unwrap_err();
        assert!(matches!(err, ToolError::InvalidInput(_)));
    }

    #[test]
    fn invalid_json_error_message_includes_position() {
        // serde_json reports line/column, which is useful to surface in the UI.
        let err = format("{\n  \"a\": 1,\n  \"b\":\n}", "  ").unwrap_err();
        let ToolError::InvalidInput(message) = err else {
            panic!("expected InvalidInput");
        };
        assert!(
            message.contains("line") && message.contains("column"),
            "message lacks position info: {message}"
        );
    }
}
