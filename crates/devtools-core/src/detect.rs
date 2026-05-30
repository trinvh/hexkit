//! Smart detection: guess the right tool for an arbitrary string (e.g. the
//! clipboard contents).

use crate::error::{ToolError, ToolResult};
use serde::{Deserialize, Serialize};
use serde_json::Value;

#[derive(Debug, Serialize, PartialEq, Eq)]
pub struct Detection {
    /// Neutral tool kind: json, base64, jwt, url, uuid, unix_time.
    pub kind: String,
    /// Optional initial mode hint (e.g. base64 -> "decode").
    pub mode: Option<String>,
}

/// Detect the most likely tool for `input`, or `None` if nothing fits.
/// Checks are ordered most-specific first.
pub fn detect(input: &str) -> Option<Detection> {
    let trimmed = input.trim();
    if trimmed.is_empty() {
        return None;
    }
    if is_jwt(trimmed) {
        return Some(Detection { kind: "jwt".into(), mode: None });
    }
    if is_json(trimmed) {
        return Some(Detection { kind: "json".into(), mode: None });
    }
    if is_xml(trimmed) {
        return Some(Detection { kind: "xml".into(), mode: None });
    }
    if is_sql(trimmed) {
        return Some(Detection { kind: "sql".into(), mode: None });
    }
    if is_css(trimmed) {
        return Some(Detection { kind: "css".into(), mode: None });
    }
    if is_url(trimmed) {
        return Some(Detection { kind: "url".into(), mode: None });
    }
    if is_uuid_or_ulid(trimmed) {
        return Some(Detection { kind: "uuid".into(), mode: None });
    }
    if is_unix_time(trimmed) {
        return Some(Detection { kind: "unix_time".into(), mode: None });
    }
    if is_base64(trimmed) {
        return Some(Detection {
            kind: "base64".into(),
            mode: Some("decode".into()),
        });
    }
    None
}

fn is_jwt(s: &str) -> bool {
    let parts: Vec<&str> = s.split('.').collect();
    if parts.len() != 3 || parts.iter().any(|part| part.is_empty()) {
        return false;
    }
    match crate::base64::decode(parts[0]) {
        Ok(json) => serde_json::from_str::<Value>(&json)
            .map(|value| value.get("alg").is_some())
            .unwrap_or(false),
        Err(_) => false,
    }
}

fn is_json(s: &str) -> bool {
    (s.starts_with('{') || s.starts_with('[')) && serde_json::from_str::<Value>(s).is_ok()
}

/// Strict-ish XML check: input must start with `<`, must contain at least one
/// element, and the whole document must parse without errors under
/// `quick_xml`'s strict end-tag matching. This deliberately excludes most
/// HTML (unquoted attributes, unclosed tags) which would otherwise be
/// confused with XML.
fn is_xml(s: &str) -> bool {
    if !s.starts_with('<') {
        return false;
    }
    let mut reader = quick_xml::Reader::from_str(s);
    reader.config_mut().check_end_names = true;
    let mut buf = Vec::new();
    let mut saw_element = false;
    loop {
        match reader.read_event_into(&mut buf) {
            Ok(quick_xml::events::Event::Eof) => return saw_element,
            Ok(quick_xml::events::Event::Start(_))
            | Ok(quick_xml::events::Event::Empty(_)) => {
                saw_element = true;
            }
            Ok(_) => {}
            Err(_) => return false,
        }
        buf.clear();
    }
}

/// Looks like a SQL statement: a leading DDL/DML/transactional keyword AND
/// some non-prose signal — either a clause marker paired with a structural
/// character (`,`, `(`, `=`, `*`, `;`) or, for short statements, a trailing
/// `;`. The double-signal rule keeps English like "Select an option from the
/// list" from triggering.
fn is_sql(s: &str) -> bool {
    let first_word = s.split_whitespace().next().unwrap_or("");
    let first_upper = first_word.to_ascii_uppercase();
    let starts_with_keyword = matches!(
        first_upper.as_str(),
        "SELECT"
            | "INSERT"
            | "UPDATE"
            | "DELETE"
            | "CREATE"
            | "DROP"
            | "ALTER"
            | "WITH"
            | "TRUNCATE"
            | "MERGE"
            | "GRANT"
            | "REVOKE"
            | "BEGIN"
            | "COMMIT"
            | "ROLLBACK"
            | "USE"
            | "SHOW"
            | "EXPLAIN"
            | "DESCRIBE"
            | "DESC"
            | "VALUES"
    );
    if !starts_with_keyword {
        return false;
    }
    let upper = format!(" {} ", s.to_ascii_uppercase());
    let has_clause = [
        " FROM ",
        " INTO ",
        " SET ",
        " WHERE ",
        " VALUES ",
        " TABLE ",
        " VIEW ",
        " INDEX ",
        " DATABASE ",
        " SCHEMA ",
        " JOIN ",
        " GROUP BY ",
        " ORDER BY ",
        " LIMIT ",
        " HAVING ",
    ]
    .iter()
    .any(|m| upper.contains(m));
    let has_structure = s
        .bytes()
        .any(|b| matches!(b, b'(' | b';' | b'=' | b',' | b'*'));
    let terminator = s.trim_end().ends_with(';');

    (has_clause && has_structure) || terminator
}

/// Heuristic CSS / SCSS / Less check: at least one selector + brace block
/// with a `property: value` declaration. Rejects empty blocks, JSON-like
/// brace syntax, and bare braces.
fn is_css(s: &str) -> bool {
    let bytes = s.as_bytes();
    let Some(open) = bytes.iter().position(|&b| b == b'{') else {
        return false;
    };
    let selector = s[..open].trim();
    if selector.is_empty() {
        return false;
    }
    // JSON objects also start with `{`, but they don't have a selector before
    // it. Strings/arrays don't either. This guard rules them out.
    if selector.starts_with('"') || selector.starts_with('[') || selector.starts_with('{') {
        return false;
    }
    let Some(close_offset) = s[open + 1..].find('}') else {
        return false;
    };
    let body = &s[open + 1..open + 1 + close_offset];
    has_css_declaration(body)
}

fn has_css_declaration(body: &str) -> bool {
    for chunk in body.split(';') {
        let chunk = chunk.trim();
        if chunk.is_empty() {
            continue;
        }
        let Some((prop, value)) = chunk.split_once(':') else {
            continue;
        };
        let prop = prop.trim();
        let value = value.trim();
        if prop.is_empty() || value.is_empty() {
            continue;
        }
        // Property names are alphanumeric + `-` (e.g. `background-color`) and
        // start with a letter or `-`. This rules out JSON keys like `"a":1`.
        let first = prop.bytes().next().unwrap_or(b'0');
        if !(first.is_ascii_alphabetic() || first == b'-') {
            continue;
        }
        if prop.bytes().all(|b| b.is_ascii_alphanumeric() || b == b'-') {
            return true;
        }
    }
    false
}

fn is_url(s: &str) -> bool {
    match ::url::Url::parse(s) {
        Ok(url) => {
            matches!(url.scheme(), "http" | "https" | "ftp" | "ws" | "wss") && url.host().is_some()
        }
        Err(_) => false,
    }
}

fn is_uuid_or_ulid(s: &str) -> bool {
    uuid::Uuid::parse_str(s).is_ok() || ulid::Ulid::from_string(s).is_ok()
}

fn is_unix_time(s: &str) -> bool {
    (9..=13).contains(&s.len()) && s.bytes().all(|b| b.is_ascii_digit())
}

fn is_base64(s: &str) -> bool {
    if s.len() < 8 {
        return false;
    }
    let charset_ok = s
        .bytes()
        .all(|b| b.is_ascii_alphanumeric() || matches!(b, b'+' | b'/' | b'=' | b'-' | b'_'));
    if !charset_ok {
        return false;
    }
    if !s.contains('=') && !s.len().is_multiple_of(4) {
        return false;
    }
    crate::base64::decode(s).is_ok()
}

#[derive(Deserialize)]
struct OneInput {
    input: String,
}

pub fn dispatch(action: &str, params: Value) -> ToolResult<Value> {
    let parsed: OneInput =
        serde_json::from_value(params).map_err(|e| ToolError::invalid_input(e.to_string()))?;
    match action {
        "detect.run" => {
            serde_json::to_value(detect(&parsed.input)).map_err(|e| ToolError::other(e.to_string()))
        }
        _ => Err(ToolError::invalid_input(format!("unknown action: {action}"))),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn kind(input: &str) -> Option<String> {
        detect(input).map(|d| d.kind)
    }

    #[test]
    fn detects_unix_timestamp() {
        assert_eq!(kind("1611241901").as_deref(), Some("unix_time"));
        assert_eq!(kind("1611241901000").as_deref(), Some("unix_time"));
    }

    #[test]
    fn detects_json() {
        assert_eq!(kind(r#"{"abc": 123}"#).as_deref(), Some("json"));
        assert_eq!(kind("[1, 2, 3]").as_deref(), Some("json"));
    }

    #[test]
    fn detects_base64_with_decode_mode() {
        let detection = detect("aGVsbG8gd29ybGQ=").unwrap();
        assert_eq!(detection.kind, "base64");
        assert_eq!(detection.mode.as_deref(), Some("decode"));
    }

    #[test]
    fn detects_url() {
        assert_eq!(kind("https://example.com/path?x=1").as_deref(), Some("url"));
    }

    #[test]
    fn detects_jwt() {
        let token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";
        assert_eq!(kind(token).as_deref(), Some("jwt"));
    }

    #[test]
    fn detects_uuid() {
        assert_eq!(
            kind("550e8400-e29b-41d4-a716-446655440000").as_deref(),
            Some("uuid")
        );
    }

    #[test]
    fn ignores_plain_text() {
        assert_eq!(kind("hello world"), None);
        assert_eq!(kind("just some prose here"), None);
    }

    #[test]
    fn ignores_empty_input() {
        assert_eq!(kind(""), None);
        assert_eq!(kind("   "), None);
    }

    #[test]
    fn json_takes_priority_over_base64() {
        // A JSON object is detected as JSON, not base64.
        assert_eq!(kind(r#"{"a":1}"#).as_deref(), Some("json"));
    }

    #[test]
    fn detects_xml_with_declaration() {
        let xml = r#"<?xml version="1.0"?><root><child id="1"/></root>"#;
        assert_eq!(kind(xml).as_deref(), Some("xml"));
    }

    #[test]
    fn detects_xml_fragment_without_declaration() {
        assert_eq!(
            kind("<users><user>Alice</user></users>").as_deref(),
            Some("xml"),
        );
    }

    #[test]
    fn detects_self_closing_xml() {
        assert_eq!(kind(r#"<note done="true"/>"#).as_deref(), Some("xml"));
    }

    #[test]
    fn rejects_malformed_xml() {
        // Mismatched end tag should not be detected as XML.
        assert_eq!(kind("<a><b></a></b>"), None);
        // A lone `<` is not XML.
        assert_eq!(kind("<"), None);
        // Comparison expressions like `<3` shouldn't be misread as XML.
        assert_eq!(kind("x < 3 && y > 1"), None);
    }

    #[test]
    fn detects_select_statement() {
        assert_eq!(
            kind("SELECT id, name FROM users WHERE active = true").as_deref(),
            Some("sql"),
        );
    }

    #[test]
    fn detects_lowercase_dml_with_terminator() {
        assert_eq!(
            kind("delete from sessions where expires_at < now();").as_deref(),
            Some("sql"),
        );
    }

    #[test]
    fn detects_ddl_with_cte() {
        let q = "WITH ranked AS (SELECT id FROM events ORDER BY ts) SELECT * FROM ranked LIMIT 10;";
        assert_eq!(kind(q).as_deref(), Some("sql"));
    }

    #[test]
    fn rejects_prose_starting_with_sql_keyword() {
        // "Select an option" prose has no SQL marker or terminator.
        assert_eq!(kind("Select an option from the list"), None);
        // Bare word.
        assert_eq!(kind("SELECT"), None);
    }

    #[test]
    fn detects_basic_css_rule() {
        assert_eq!(
            kind("body { background: white; color: #222; }").as_deref(),
            Some("css"),
        );
    }

    #[test]
    fn detects_scss_with_nesting() {
        let scss = ".card {\n  padding: 1rem;\n  .title { font-weight: bold; }\n}";
        assert_eq!(kind(scss).as_deref(), Some("css"));
    }

    #[test]
    fn rejects_json_object_as_css() {
        // JSON objects also have `{ ... }` but no selector before them.
        assert_eq!(kind(r#"{"a": 1}"#).as_deref(), Some("json"));
    }
}
