//! CSV <-> JSON conversion.

use crate::error::{ToolError, ToolResult};
use serde::Deserialize;
use serde_json::{Map, Value};

/// Convert CSV (with a header row) to a JSON array of objects.
pub fn to_json(input: &str) -> ToolResult<String> {
    let mut reader = csv::ReaderBuilder::new()
        .has_headers(true)
        .from_reader(input.as_bytes());
    let headers = reader
        .headers()
        .map_err(|e| ToolError::invalid_input(e.to_string()))?
        .clone();

    let mut rows = Vec::new();
    for record in reader.records() {
        let record = record.map_err(|e| ToolError::invalid_input(e.to_string()))?;
        let mut obj = Map::new();
        for (header, value) in headers.iter().zip(record.iter()) {
            obj.insert(header.to_string(), Value::String(value.to_string()));
        }
        rows.push(Value::Object(obj));
    }

    serde_json::to_string_pretty(&Value::Array(rows)).map_err(|e| ToolError::other(e.to_string()))
}

/// Convert a JSON array of objects to CSV.
pub fn from_json(input: &str) -> ToolResult<String> {
    let value: Value =
        serde_json::from_str(input).map_err(|e| ToolError::invalid_input(e.to_string()))?;
    let array = value
        .as_array()
        .ok_or_else(|| ToolError::invalid_input("expected a JSON array of objects"))?;

    let mut headers: Vec<String> = Vec::new();
    for item in array {
        let obj = item
            .as_object()
            .ok_or_else(|| ToolError::invalid_input("array items must be objects"))?;
        for key in obj.keys() {
            if !headers.contains(key) {
                headers.push(key.clone());
            }
        }
    }

    let mut writer = csv::Writer::from_writer(Vec::new());
    writer
        .write_record(&headers)
        .map_err(|e| ToolError::other(e.to_string()))?;
    for item in array {
        let obj = item.as_object().unwrap();
        let row: Vec<String> = headers
            .iter()
            .map(|h| match obj.get(h) {
                Some(Value::String(s)) => s.clone(),
                Some(Value::Null) | None => String::new(),
                Some(other) => other.to_string(),
            })
            .collect();
        writer
            .write_record(&row)
            .map_err(|e| ToolError::other(e.to_string()))?;
    }

    let bytes = writer
        .into_inner()
        .map_err(|e| ToolError::other(e.to_string()))?;
    String::from_utf8(bytes).map_err(|e| ToolError::other(e.to_string()))
}

#[derive(Deserialize)]
struct OneInput {
    input: String,
}

pub fn dispatch(action: &str, params: Value) -> ToolResult<Value> {
    let parsed: OneInput =
        serde_json::from_value(params).map_err(|e| ToolError::invalid_input(e.to_string()))?;
    match action {
        "csv.to_json" => Ok(Value::String(to_json(&parsed.input)?)),
        "csv.from_json" => Ok(Value::String(from_json(&parsed.input)?)),
        _ => Err(ToolError::invalid_input(format!("unknown action: {action}"))),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn csv_to_json() {
        let json = to_json("a,b\n1,2\n3,4").unwrap();
        let value: Value = serde_json::from_str(&json).unwrap();
        assert_eq!(value[0]["a"], "1");
        assert_eq!(value[1]["b"], "4");
    }

    #[test]
    fn json_to_csv() {
        let csv = from_json(r#"[{"a":1,"b":2},{"a":3,"b":4}]"#).unwrap();
        assert_eq!(csv, "a,b\n1,2\n3,4\n");
    }

    #[test]
    fn rejects_non_array_json() {
        assert!(matches!(from_json(r#"{"a":1}"#), Err(ToolError::InvalidInput(_))));
    }

    #[test]
    fn rejects_non_object_items() {
        assert!(matches!(from_json("[1, 2, 3]"), Err(ToolError::InvalidInput(_))));
    }
}
