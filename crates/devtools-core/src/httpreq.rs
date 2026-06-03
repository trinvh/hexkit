//! HTTP request modelling for the **HTTP Client** tool.
//!
//! This module is the *pure* half of the tool: it parses a `curl` command into a
//! structured [`HttpRequest`], serializes a request back to `curl`, and builds
//! the on-the-wire pieces ([`Wire`]) an HTTP client needs (merged URL, header
//! list, encoded body). It performs **no I/O** — the actual network send lives
//! in the Tauri shell (`src-tauri`), so the offline guarantee stays mechanical:
//! nothing here can reach the network.
//!
//! Reachable from the CLI and MCP as `httpreq.from_curl` / `httpreq.to_curl`.

use crate::error::{ToolError, ToolResult};
use serde::{Deserialize, Serialize};
use serde_json::Value;

/// A single editable key/value pair (header, query param, or form field). The
/// `enabled` flag mirrors Postman's per-row checkbox: disabled rows are kept in
/// the model (so the UI can toggle them) but dropped when the request is built.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct Param {
    pub key: String,
    pub value: String,
    #[serde(default = "default_true")]
    pub enabled: bool,
}

fn default_true() -> bool {
    true
}

impl Param {
    fn new(key: impl Into<String>, value: impl Into<String>) -> Self {
        Self { key: key.into(), value: value.into(), enabled: true }
    }
}

/// The request body, tagged so it round-trips cleanly through JSON to the UI.
#[derive(Debug, Clone, Default, PartialEq, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "camelCase")]
pub enum Body {
    /// No body (typical for GET).
    #[default]
    None,
    /// A raw payload (JSON, text, XML…) with an explicit content type.
    #[serde(rename_all = "camelCase")]
    Raw { content: String, content_type: String },
    /// `application/x-www-form-urlencoded` fields.
    Form { fields: Vec<Param> },
    /// `multipart/form-data` text fields (file parts are not supported yet).
    Multipart { fields: Vec<Param> },
}

/// A structured HTTP request — the shared model between the curl parser, the
/// curl serializer, the wire builder, and the frontend.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct HttpRequest {
    pub method: String,
    /// Base URL **without** the query string; query params live in `query`.
    pub url: String,
    #[serde(default)]
    pub query: Vec<Param>,
    #[serde(default)]
    pub headers: Vec<Param>,
    #[serde(default)]
    pub body: Body,
}

/// The on-the-wire form of a request: a merged URL, a flat header list, and the
/// already-encoded body bytes. Produced by [`build_wire`] and consumed by the
/// network layer in the Tauri shell.
#[derive(Debug, Clone, PartialEq)]
pub struct Wire {
    pub method: String,
    pub url: String,
    pub headers: Vec<(String, String)>,
    pub body: Option<Vec<u8>>,
}

/// Fixed multipart boundary. Browsers use a similar constant; collisions with
/// field values are possible but vanishingly unlikely for the text fields v1
/// supports. (Documented limitation — file parts will need a random boundary.)
const MULTIPART_BOUNDARY: &str = "----HexkitFormBoundary7MA4YWxkTrZu0gW";

fn has_header(headers: &[Param], name: &str) -> bool {
    headers
        .iter()
        .any(|h| h.enabled && h.key.eq_ignore_ascii_case(name))
}

fn urlencode_pairs(params: &[Param]) -> String {
    let mut ser = url::form_urlencoded::Serializer::new(String::new());
    for p in params.iter().filter(|p| p.enabled && !p.key.is_empty()) {
        ser.append_pair(&p.key, &p.value);
    }
    ser.finish()
}

/// Merge the query params into the URL, flatten enabled headers, and encode the
/// body. Adds a `Content-Type` for form/raw bodies only when the caller hasn't
/// already set one.
pub fn build_wire(req: &HttpRequest) -> ToolResult<Wire> {
    if req.url.trim().is_empty() {
        return Err(ToolError::invalid_input("request URL is empty"));
    }

    let method = if req.method.trim().is_empty() {
        "GET".to_string()
    } else {
        req.method.trim().to_uppercase()
    };

    // Merge query params onto the base URL.
    let qs = urlencode_pairs(&req.query);
    let url = if qs.is_empty() {
        req.url.clone()
    } else {
        let sep = if req.url.contains('?') { '&' } else { '?' };
        format!("{}{sep}{qs}", req.url)
    };

    let mut headers: Vec<(String, String)> = req
        .headers
        .iter()
        .filter(|h| h.enabled && !h.key.is_empty())
        .map(|h| (h.key.clone(), h.value.clone()))
        .collect();

    let body = match &req.body {
        Body::None => None,
        Body::Raw { content, content_type } => {
            if !content_type.is_empty() && !has_header(&req.headers, "content-type") {
                headers.push(("Content-Type".to_string(), content_type.clone()));
            }
            Some(content.clone().into_bytes())
        }
        Body::Form { fields } => {
            if !has_header(&req.headers, "content-type") {
                headers.push((
                    "Content-Type".to_string(),
                    "application/x-www-form-urlencoded".to_string(),
                ));
            }
            Some(urlencode_pairs(fields).into_bytes())
        }
        Body::Multipart { fields } => {
            if !has_header(&req.headers, "content-type") {
                headers.push((
                    "Content-Type".to_string(),
                    format!("multipart/form-data; boundary={MULTIPART_BOUNDARY}"),
                ));
            }
            let mut buf = String::new();
            for f in fields.iter().filter(|f| f.enabled && !f.key.is_empty()) {
                buf.push_str(&format!("--{MULTIPART_BOUNDARY}\r\n"));
                buf.push_str(&format!(
                    "Content-Disposition: form-data; name=\"{}\"\r\n\r\n",
                    f.key
                ));
                buf.push_str(&f.value);
                buf.push_str("\r\n");
            }
            buf.push_str(&format!("--{MULTIPART_BOUNDARY}--\r\n"));
            Some(buf.into_bytes())
        }
    };

    Ok(Wire { method, url, headers, body })
}

// ---------------------------------------------------------------------------
// curl → HttpRequest
// ---------------------------------------------------------------------------

/// Parse a `curl` command line into a structured [`HttpRequest`].
///
/// Supports the flags developers actually paste: `-X/--request`, `--url`,
/// `-H/--header`, `-d/--data*`, `--data-urlencode`, `-F/--form`, `-G/--get`,
/// `-u/--user`, `-A/--user-agent`, `-e/--referer`, `-b/--cookie`. Unknown flags
/// are skipped. The URL's own query string is split out into `query` so the UI
/// can edit params individually.
pub fn from_curl(command: &str) -> ToolResult<HttpRequest> {
    let tokens =
        shell_words::split(command.trim()).map_err(|e| ToolError::invalid_input(e.to_string()))?;
    let mut iter = tokens.iter().peekable();
    if iter.peek().map(|s| s.as_str()) == Some("curl") {
        iter.next();
    }

    let mut raw_url: Option<String> = None;
    let mut method: Option<String> = None;
    let mut headers: Vec<Param> = Vec::new();
    let mut data_parts: Vec<String> = Vec::new();
    let mut form_fields: Vec<Param> = Vec::new();
    let mut get_with_data = false;

    while let Some(token) = iter.next() {
        match token.as_str() {
            "-X" | "--request" => method = iter.next().cloned(),
            "--url" => raw_url = iter.next().cloned(),
            "-G" | "--get" => get_with_data = true,
            "-H" | "--header" => {
                if let Some((key, value)) = iter.next().and_then(|h| h.split_once(':')) {
                    headers.push(Param::new(key.trim(), value.trim()));
                }
            }
            "-d" | "--data" | "--data-raw" | "--data-binary" | "--data-ascii"
            | "--data-urlencode" => {
                if let Some(value) = iter.next() {
                    data_parts.push(value.clone());
                }
            }
            "-F" | "--form" => {
                if let Some((key, value)) = iter.next().and_then(|f| f.split_once('=')) {
                    form_fields.push(Param::new(key, value));
                }
            }
            "-u" | "--user" => {
                if let Some(user) = iter.next() {
                    headers.push(Param::new(
                        "Authorization",
                        format!("Basic {}", crate::base64::encode(user)),
                    ));
                }
            }
            "-A" | "--user-agent" => {
                if let Some(ua) = iter.next() {
                    headers.push(Param::new("User-Agent", ua.clone()));
                }
            }
            "-e" | "--referer" => {
                if let Some(referer) = iter.next() {
                    headers.push(Param::new("Referer", referer.clone()));
                }
            }
            "-b" | "--cookie" => {
                if let Some(cookie) = iter.next() {
                    headers.push(Param::new("Cookie", cookie.clone()));
                }
            }
            // Flags that take no argument we care about — ignore.
            flag if flag.starts_with('-') => {}
            positional => {
                if raw_url.is_none() {
                    raw_url = Some(positional.to_string());
                }
            }
        }
    }

    let raw_url = raw_url.ok_or_else(|| ToolError::invalid_input("no URL found in curl command"))?;

    // Split the URL's own query string into editable params.
    let (base_url, mut query) = split_query(&raw_url);

    let joined_data = data_parts.join("&");
    let has_data = !joined_data.is_empty();

    // `-G` turns data into query params on a GET request.
    if get_with_data && has_data {
        for (k, v) in url::form_urlencoded::parse(joined_data.as_bytes()) {
            query.push(Param::new(k.into_owned(), v.into_owned()));
        }
    }

    let body = if !form_fields.is_empty() {
        Body::Multipart { fields: form_fields }
    } else if has_data && !get_with_data {
        let content_type = headers
            .iter()
            .find(|h| h.key.eq_ignore_ascii_case("content-type"))
            .map(|h| h.value.clone())
            .unwrap_or_default();
        Body::Raw { content: joined_data, content_type }
    } else {
        Body::None
    };

    let method = method
        .unwrap_or_else(|| {
            if matches!(body, Body::None) || get_with_data {
                "GET".to_string()
            } else {
                "POST".to_string()
            }
        })
        .to_uppercase();

    Ok(HttpRequest { method, url: base_url, query, headers, body })
}

/// Split `url` into its base and decoded query params (on the first `?`).
fn split_query(url: &str) -> (String, Vec<Param>) {
    match url.split_once('?') {
        Some((base, query)) => {
            let params = url::form_urlencoded::parse(query.as_bytes())
                .map(|(k, v)| Param::new(k.into_owned(), v.into_owned()))
                .collect();
            (base.to_string(), params)
        }
        None => (url.to_string(), Vec::new()),
    }
}

// ---------------------------------------------------------------------------
// HttpRequest → curl
// ---------------------------------------------------------------------------

/// Serialize an [`HttpRequest`] back into a runnable `curl` command.
pub fn to_curl(req: &HttpRequest) -> String {
    let wire = match build_wire(req) {
        Ok(w) => w,
        // build_wire only fails on an empty URL; emit a minimal stub so the UI
        // still has something to show rather than erroring on export.
        Err(_) => return "curl".to_string(),
    };

    let mut parts: Vec<String> = vec!["curl".to_string()];

    if wire.method != "GET" {
        parts.push("-X".to_string());
        parts.push(wire.method.clone());
    }

    parts.push(shell_quote(&wire.url));

    for (k, v) in &wire.headers {
        parts.push("-H".to_string());
        parts.push(shell_quote(&format!("{k}: {v}")));
    }

    match &req.body {
        Body::Multipart { fields } => {
            for f in fields.iter().filter(|f| f.enabled && !f.key.is_empty()) {
                parts.push("-F".to_string());
                parts.push(shell_quote(&format!("{}={}", f.key, f.value)));
            }
        }
        _ => {
            if let Some(bytes) = &wire.body {
                if !bytes.is_empty() {
                    parts.push("--data".to_string());
                    parts.push(shell_quote(&String::from_utf8_lossy(bytes)));
                }
            }
        }
    }

    parts.join(" ")
}

/// Wrap a value in single quotes for a POSIX shell, escaping embedded quotes.
fn shell_quote(value: &str) -> String {
    if !value.is_empty()
        && value
            .bytes()
            .all(|b| b.is_ascii_alphanumeric() || matches!(b, b'_' | b'-' | b'.' | b'/' | b':'))
    {
        return value.to_string();
    }
    format!("'{}'", value.replace('\'', r"'\''"))
}

// ---------------------------------------------------------------------------
// dispatch
// ---------------------------------------------------------------------------

#[derive(Deserialize)]
struct FromCurlParams {
    command: String,
}

pub fn dispatch(action: &str, params: Value) -> ToolResult<Value> {
    match action {
        "httpreq.from_curl" => {
            let p: FromCurlParams = serde_json::from_value(params)
                .map_err(|e| ToolError::invalid_input(e.to_string()))?;
            serde_json::to_value(from_curl(&p.command)?)
                .map_err(|e| ToolError::invalid_input(e.to_string()))
        }
        "httpreq.to_curl" => {
            // Here the params object *is* the request.
            let req: HttpRequest = serde_json::from_value(params)
                .map_err(|e| ToolError::invalid_input(e.to_string()))?;
            Ok(Value::String(to_curl(&req)))
        }
        _ => Err(ToolError::invalid_input(format!("unknown action: {action}"))),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parses_bare_get() {
        let req = from_curl("curl https://api.example.com/users").unwrap();
        assert_eq!(req.method, "GET");
        assert_eq!(req.url, "https://api.example.com/users");
        assert!(req.query.is_empty());
        assert_eq!(req.body, Body::None);
    }

    #[test]
    fn splits_url_query_into_params() {
        let req = from_curl("curl 'https://api.example.com/search?q=rust&page=2'").unwrap();
        assert_eq!(req.url, "https://api.example.com/search");
        assert_eq!(req.query, vec![Param::new("q", "rust"), Param::new("page", "2")]);
    }

    #[test]
    fn infers_post_from_data_and_keeps_headers() {
        let req = from_curl(
            r#"curl -H "Content-Type: application/json" -d '{"a":1}' https://api.example.com"#,
        )
        .unwrap();
        assert_eq!(req.method, "POST");
        assert_eq!(req.headers, vec![Param::new("Content-Type", "application/json")]);
        assert_eq!(
            req.body,
            Body::Raw { content: r#"{"a":1}"#.to_string(), content_type: "application/json".into() }
        );
    }

    #[test]
    fn explicit_method_wins() {
        let req = from_curl("curl -X DELETE https://api.example.com/users/1").unwrap();
        assert_eq!(req.method, "DELETE");
    }

    #[test]
    fn user_flag_becomes_basic_auth() {
        let req = from_curl("curl -u alice:secret https://api.example.com").unwrap();
        let auth = req.headers.iter().find(|h| h.key == "Authorization").unwrap();
        assert!(auth.value.starts_with("Basic "));
    }

    #[test]
    fn form_flag_becomes_multipart() {
        let req = from_curl("curl -F name=alice -F role=admin https://api.example.com").unwrap();
        assert_eq!(
            req.body,
            Body::Multipart { fields: vec![Param::new("name", "alice"), Param::new("role", "admin")] }
        );
    }

    #[test]
    fn get_flag_moves_data_to_query() {
        let req = from_curl("curl -G -d q=rust -d page=2 https://api.example.com/search").unwrap();
        assert_eq!(req.method, "GET");
        assert_eq!(req.body, Body::None);
        assert_eq!(req.query, vec![Param::new("q", "rust"), Param::new("page", "2")]);
    }

    #[test]
    fn missing_url_is_invalid_input() {
        assert!(matches!(from_curl("curl -X GET"), Err(ToolError::InvalidInput(_))));
    }

    #[test]
    fn build_wire_merges_query() {
        let req = HttpRequest {
            method: "get".into(),
            url: "https://api.example.com/s".into(),
            query: vec![Param::new("q", "a b"), Param { key: "skip".into(), value: "x".into(), enabled: false }],
            headers: vec![],
            body: Body::None,
        };
        let wire = build_wire(&req).unwrap();
        assert_eq!(wire.method, "GET");
        assert_eq!(wire.url, "https://api.example.com/s?q=a+b");
        assert!(wire.body.is_none());
    }

    #[test]
    fn build_wire_form_sets_content_type() {
        let req = HttpRequest {
            method: "POST".into(),
            url: "https://x.com".into(),
            query: vec![],
            headers: vec![],
            body: Body::Form { fields: vec![Param::new("a", "1"), Param::new("b", "2")] },
        };
        let wire = build_wire(&req).unwrap();
        assert!(wire
            .headers
            .iter()
            .any(|(k, v)| k == "Content-Type" && v == "application/x-www-form-urlencoded"));
        assert_eq!(wire.body.unwrap(), b"a=1&b=2");
    }

    #[test]
    fn build_wire_respects_existing_content_type() {
        let req = HttpRequest {
            method: "POST".into(),
            url: "https://x.com".into(),
            query: vec![],
            headers: vec![Param::new("Content-Type", "application/json")],
            body: Body::Raw { content: "{}".into(), content_type: "text/plain".into() },
        };
        let wire = build_wire(&req).unwrap();
        let cts: Vec<_> = wire.headers.iter().filter(|(k, _)| k == "Content-Type").collect();
        assert_eq!(cts.len(), 1, "should not duplicate Content-Type");
        assert_eq!(cts[0].1, "application/json");
    }

    #[test]
    fn build_wire_multipart_has_boundary_and_parts() {
        let req = HttpRequest {
            method: "POST".into(),
            url: "https://x.com".into(),
            query: vec![],
            headers: vec![],
            body: Body::Multipart { fields: vec![Param::new("name", "alice")] },
        };
        let wire = build_wire(&req).unwrap();
        let body = String::from_utf8(wire.body.unwrap()).unwrap();
        assert!(body.contains("Content-Disposition: form-data; name=\"name\""));
        assert!(body.contains("alice"));
        assert!(body.trim_end().ends_with(&format!("--{MULTIPART_BOUNDARY}--")));
    }

    #[test]
    fn build_wire_empty_url_errors() {
        let req = HttpRequest {
            method: "GET".into(),
            url: "  ".into(),
            query: vec![],
            headers: vec![],
            body: Body::None,
        };
        assert!(matches!(build_wire(&req), Err(ToolError::InvalidInput(_))));
    }

    #[test]
    fn to_curl_roundtrips_method_headers_body() {
        let curl = r#"curl -X POST 'https://api.example.com/users' -H 'Content-Type: application/json' --data '{"name":"Alice"}'"#;
        let req = from_curl(curl).unwrap();
        let out = to_curl(&req);
        assert!(out.contains("-X POST"));
        assert!(out.contains("https://api.example.com/users"));
        assert!(out.contains("Content-Type: application/json"));
        assert!(out.contains(r#"{"name":"Alice"}"#));
        // And it re-parses.
        assert_eq!(from_curl(&out).unwrap().method, "POST");
    }

    #[test]
    fn to_curl_appends_query() {
        let req = HttpRequest {
            method: "GET".into(),
            url: "https://api.example.com/s".into(),
            query: vec![Param::new("q", "rust")],
            headers: vec![],
            body: Body::None,
        };
        let out = to_curl(&req);
        assert!(out.contains("q=rust"), "got: {out}");
    }

    #[test]
    fn dispatch_from_curl_returns_request_json() {
        let out = dispatch(
            "httpreq.from_curl",
            serde_json::json!({ "command": "curl https://x.com" }),
        )
        .unwrap();
        assert_eq!(out["method"], "GET");
        assert_eq!(out["url"], "https://x.com");
    }

    #[test]
    fn dispatch_to_curl_takes_request_as_params() {
        let out = dispatch(
            "httpreq.to_curl",
            serde_json::json!({
                "method": "GET",
                "url": "https://x.com",
                "query": [],
                "headers": [],
                "body": { "type": "none" }
            }),
        )
        .unwrap();
        assert_eq!(out, Value::String("curl https://x.com".to_string()));
    }

    #[test]
    fn dispatch_rejects_unknown_action() {
        assert!(matches!(
            dispatch("httpreq.nope", serde_json::json!({})),
            Err(ToolError::InvalidInput(_))
        ));
    }
}
