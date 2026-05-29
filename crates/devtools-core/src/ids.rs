//! UUID (v4 / v7), ULID, and Nano ID generation and inspection.

use crate::error::{ToolError, ToolResult};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use ulid::Ulid;
use uuid::{Uuid, Variant};

#[derive(Debug, Serialize, PartialEq, Eq)]
pub struct Inspection {
    /// "UUID" or "ULID".
    pub kind: String,
    /// UUID version description (empty for ULID).
    pub version: String,
    /// Variant description (empty for ULID).
    pub variant: String,
    /// Canonical string form.
    pub canonical: String,
    /// Colon-separated hex bytes (empty for ULID).
    pub raw: String,
    /// Extra note, e.g. the ULID's creation time.
    pub detail: String,
}

/// Generate `count` (1..=100) identifiers of the given `kind`
/// (`"uuid_v4"`, `"uuid_v7"`, `"ulid"`, or `"nano_id"`). When `lowercased` is
/// set the output is lower-cased (useful for ULID / Nano ID).
pub fn generate(kind: &str, count: usize, lowercased: bool) -> ToolResult<Vec<String>> {
    if !matches!(kind, "uuid_v4" | "uuid_v7" | "ulid" | "nano_id") {
        return Err(ToolError::invalid_input(format!("unknown id kind: {kind}")));
    }
    let n = count.clamp(1, 100);
    let values = (0..n)
        .map(|_| {
            let value = match kind {
                "uuid_v4" => Uuid::new_v4().to_string(),
                "uuid_v7" => Uuid::now_v7().to_string(),
                "ulid" => Ulid::new().to_string(),
                _ => nanoid::nanoid!(),
            };
            if lowercased {
                value.to_lowercase()
            } else {
                value
            }
        })
        .collect();
    Ok(values)
}

fn variant_name(variant: Variant) -> &'static str {
    match variant {
        Variant::NCS => "NCS (reserved)",
        Variant::RFC4122 => "RFC 4122",
        Variant::Microsoft => "Microsoft (reserved)",
        Variant::Future => "Future (reserved)",
        _ => "Unknown",
    }
}

/// Inspect a UUID or ULID string, reporting its kind and key details.
pub fn inspect(value: &str) -> ToolResult<Inspection> {
    let trimmed = value.trim();
    if let Ok(uuid) = Uuid::parse_str(trimmed) {
        let raw = uuid
            .as_bytes()
            .iter()
            .map(|b| format!("{b:02x}"))
            .collect::<Vec<_>>()
            .join(":");
        return Ok(Inspection {
            kind: "UUID".to_string(),
            version: format!("{}", uuid.get_version_num()),
            variant: variant_name(uuid.get_variant()).to_string(),
            canonical: uuid.hyphenated().to_string(),
            raw,
            detail: String::new(),
        });
    }
    if let Ok(ulid) = Ulid::from_string(trimmed) {
        let millis = ulid.timestamp_ms() as i64;
        let detail = match jiff::Timestamp::from_millisecond(millis) {
            Ok(ts) => format!("created {ts}"),
            Err(_) => format!("created at {millis} ms"),
        };
        return Ok(Inspection {
            kind: "ULID".to_string(),
            version: String::new(),
            variant: String::new(),
            canonical: ulid.to_string(),
            raw: String::new(),
            detail,
        });
    }
    Err(ToolError::invalid_input("not a valid UUID or ULID"))
}

#[derive(Deserialize)]
struct GenerateParams {
    kind: String,
    count: usize,
    #[serde(default)]
    lowercased: bool,
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
            serde_json::to_value(generate(&p.kind, p.count, p.lowercased)?)
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
        let ids = generate("uuid_v4", 3, false).unwrap();
        assert_eq!(ids.len(), 3);
        for id in &ids {
            assert_eq!(Uuid::parse_str(id).unwrap().get_version_num(), 4);
        }
    }

    #[test]
    fn generates_uuid_v7() {
        let ids = generate("uuid_v7", 1, false).unwrap();
        assert_eq!(Uuid::parse_str(&ids[0]).unwrap().get_version_num(), 7);
    }

    #[test]
    fn generates_parseable_ulids() {
        let ids = generate("ulid", 5, false).unwrap();
        assert_eq!(ids.len(), 5);
        for id in &ids {
            assert!(Ulid::from_string(id).is_ok());
        }
    }

    #[test]
    fn generates_nano_ids() {
        let ids = generate("nano_id", 4, false).unwrap();
        assert_eq!(ids.len(), 4);
        // Default Nano IDs are 21 url-safe characters.
        for id in &ids {
            assert_eq!(id.len(), 21);
        }
    }

    #[test]
    fn lowercases_output_when_requested() {
        let ids = generate("ulid", 3, true).unwrap();
        for id in &ids {
            assert_eq!(*id, id.to_lowercase());
        }
    }

    #[test]
    fn clamps_count_to_1_100() {
        assert_eq!(generate("uuid_v4", 0, false).unwrap().len(), 1);
        assert_eq!(generate("uuid_v4", 1000, false).unwrap().len(), 100);
    }

    #[test]
    fn rejects_unknown_kind() {
        assert!(matches!(
            generate("nope", 1, false),
            Err(ToolError::InvalidInput(_))
        ));
    }

    #[test]
    fn inspects_a_uuid_with_version_and_variant() {
        let id = generate("uuid_v4", 1, false).unwrap().pop().unwrap();
        let info = inspect(&id).unwrap();
        assert_eq!(info.kind, "UUID");
        assert!(info.version.contains('4'));
        assert!(!info.variant.is_empty());
        // Raw bytes are surfaced as colon-separated hex (16 bytes -> 15 colons).
        assert_eq!(info.raw.matches(':').count(), 15);
    }

    #[test]
    fn inspects_a_ulid() {
        let id = generate("ulid", 1, false).unwrap().pop().unwrap();
        let info = inspect(&id).unwrap();
        assert_eq!(info.kind, "ULID");
        assert!(info.detail.contains("created"));
    }

    #[test]
    fn rejects_garbage_on_inspect() {
        assert!(matches!(inspect("not-an-id"), Err(ToolError::InvalidInput(_))));
    }
}
