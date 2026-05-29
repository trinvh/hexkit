//! UUID (v4 / v7) and ULID generation and inspection.

use crate::error::{ToolError, ToolResult};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use ulid::Ulid;
use uuid::Uuid;

#[derive(Debug, Serialize, PartialEq, Eq)]
pub struct Inspection {
    pub kind: String,
    pub detail: String,
}

/// Generate `count` (1..=100) identifiers of the given `kind`
/// (`"uuid_v4"`, `"uuid_v7"`, or `"ulid"`).
pub fn generate(kind: &str, count: usize) -> ToolResult<Vec<String>> {
    if !matches!(kind, "uuid_v4" | "uuid_v7" | "ulid") {
        return Err(ToolError::invalid_input(format!("unknown id kind: {kind}")));
    }
    let n = count.clamp(1, 100);
    let values = (0..n)
        .map(|_| match kind {
            "uuid_v4" => Uuid::new_v4().to_string(),
            "uuid_v7" => Uuid::now_v7().to_string(),
            _ => Ulid::new().to_string(),
        })
        .collect();
    Ok(values)
}

/// Inspect a UUID or ULID string, reporting its kind and key details.
pub fn inspect(value: &str) -> ToolResult<Inspection> {
    let trimmed = value.trim();
    if let Ok(uuid) = Uuid::parse_str(trimmed) {
        return Ok(Inspection {
            kind: "UUID".to_string(),
            detail: format!("version {}", uuid.get_version_num()),
        });
    }
    if let Ok(ulid) = Ulid::from_string(trimmed) {
        let millis = ulid.timestamp_ms() as i64;
        let detail = match jiff::Timestamp::from_millisecond(millis) {
            Ok(ts) => format!("created {ts}"),
            Err(_) => format!("{millis} ms"),
        };
        return Ok(Inspection {
            kind: "ULID".to_string(),
            detail,
        });
    }
    Err(ToolError::invalid_input("not a valid UUID or ULID"))
}

#[derive(Deserialize)]
struct GenerateParams {
    kind: String,
    count: usize,
}

#[derive(Deserialize)]
struct InspectParams {
    value: String,
}

pub fn dispatch(action: &str, params: Value) -> ToolResult<Value> {
    match action {
        "id.generate" => {
            let p: GenerateParams = serde_json::from_value(params)
                .map_err(|e| ToolError::invalid_input(e.to_string()))?;
            serde_json::to_value(generate(&p.kind, p.count)?)
                .map_err(|e| ToolError::other(e.to_string()))
        }
        "id.inspect" => {
            let p: InspectParams = serde_json::from_value(params)
                .map_err(|e| ToolError::invalid_input(e.to_string()))?;
            serde_json::to_value(inspect(&p.value)?).map_err(|e| ToolError::other(e.to_string()))
        }
        _ => Err(ToolError::invalid_input(format!("unknown action: {action}"))),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn generates_requested_count_of_uuid_v4() {
        let ids = generate("uuid_v4", 3).unwrap();
        assert_eq!(ids.len(), 3);
        for id in &ids {
            assert_eq!(Uuid::parse_str(id).unwrap().get_version_num(), 4);
        }
    }

    #[test]
    fn generates_uuid_v7() {
        let ids = generate("uuid_v7", 1).unwrap();
        assert_eq!(Uuid::parse_str(&ids[0]).unwrap().get_version_num(), 7);
    }

    #[test]
    fn generates_parseable_ulids() {
        let ids = generate("ulid", 5).unwrap();
        assert_eq!(ids.len(), 5);
        for id in &ids {
            assert!(Ulid::from_string(id).is_ok());
        }
    }

    #[test]
    fn clamps_count_to_1_100() {
        assert_eq!(generate("uuid_v4", 0).unwrap().len(), 1);
        assert_eq!(generate("uuid_v4", 1000).unwrap().len(), 100);
    }

    #[test]
    fn rejects_unknown_kind() {
        assert!(matches!(generate("nope", 1), Err(ToolError::InvalidInput(_))));
    }

    #[test]
    fn inspects_a_uuid() {
        let id = generate("uuid_v4", 1).unwrap().pop().unwrap();
        let info = inspect(&id).unwrap();
        assert_eq!(info.kind, "UUID");
        assert!(info.detail.contains("4"));
    }

    #[test]
    fn inspects_a_ulid() {
        let id = generate("ulid", 1).unwrap().pop().unwrap();
        assert_eq!(inspect(&id).unwrap().kind, "ULID");
    }

    #[test]
    fn rejects_garbage_on_inspect() {
        assert!(matches!(inspect("not-an-id"), Err(ToolError::InvalidInput(_))));
    }
}
