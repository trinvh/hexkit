//! Parse `hexkit://` deep links into an action id and JSON params.
//!
//! Format: `hexkit://<action>?<key>=<value>&…`, e.g.
//! `hexkit://base64.encode?input=hello`. Numeric-looking values become JSON
//! numbers so tools with numeric params (e.g. `number.convert?base=16`) work.

use crate::error::{ToolError, ToolResult};
use serde_json::{Map, Value};

/// Parse a `hexkit://` URL into `(action_id, params)`.
pub fn parse_deep_link(url: &str) -> ToolResult<(String, Value)> {
    let parsed =
        ::url::Url::parse(url.trim()).map_err(|e| ToolError::invalid_input(e.to_string()))?;
    if parsed.scheme() != "hexkit" {
        return Err(ToolError::invalid_input("not a hexkit:// link"));
    }

    let action = parsed
        .host_str()
        .map(str::to_string)
        .filter(|host| !host.is_empty())
        .or_else(|| {
            let path = parsed.path().trim_start_matches('/');
            (!path.is_empty()).then(|| path.to_string())
        })
        .ok_or_else(|| ToolError::invalid_input("deep link is missing an action"))?;

    let mut params = Map::new();
    for (key, value) in parsed.query_pairs() {
        let parsed_value = match value.parse::<i64>() {
            Ok(number) => Value::from(number),
            Err(_) => Value::from(value.into_owned()),
        };
        params.insert(key.into_owned(), parsed_value);
    }

    Ok((action, Value::Object(params)))
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn parses_action_and_string_param() {
        let (action, params) = parse_deep_link("hexkit://base64.encode?input=hello").unwrap();
        assert_eq!(action, "base64.encode");
        assert_eq!(params, json!({ "input": "hello" }));
    }

    #[test]
    fn parses_numeric_params_as_numbers() {
        let (action, params) =
            parse_deep_link("hexkit://number.convert?input=ff&base=16").unwrap();
        assert_eq!(action, "number.convert");
        assert_eq!(params, json!({ "input": "ff", "base": 16 }));
    }

    #[test]
    fn decodes_percent_encoded_values() {
        let (_, params) = parse_deep_link("hexkit://url.decode?input=a%20b").unwrap();
        assert_eq!(params, json!({ "input": "a b" }));
    }

    #[test]
    fn rejects_other_schemes() {
        assert!(matches!(
            parse_deep_link("https://example.com"),
            Err(ToolError::InvalidInput(_))
        ));
    }

    #[test]
    fn rejects_missing_action() {
        assert!(matches!(
            parse_deep_link("hexkit://"),
            Err(ToolError::InvalidInput(_))
        ));
    }
}
