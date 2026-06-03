//! The HTTP Client tool's network layer.
//!
//! This is the **one** place in Hexkit that deliberately reaches the network on
//! the user's behalf — every other tool is pure/offline. The request modelling
//! (curl parsing, query merging, body encoding) lives in
//! `devtools_core::httpreq`; here we only execute the already-built [`Wire`]
//! with `ureq` and hand the response back to the frontend.
//!
//! `ureq` is blocking, so the command is `async` and offloads the call to a
//! blocking thread to avoid stalling the UI event loop.

use std::io::Read;
use std::time::{Duration, Instant};

use base64::Engine;
use devtools_core::httpreq::{build_wire, HttpRequest};

/// Hard ceiling on the response body we buffer, to avoid OOM on huge downloads.
const MAX_RESPONSE_BYTES: u64 = 10 * 1024 * 1024;
const DEFAULT_TIMEOUT_MS: u64 = 30_000;

/// The response handed back to the webview. Binary bodies are base64-encoded
/// with `bodyBase64: true` so non-UTF-8 payloads survive the JSON boundary.
#[derive(serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct HttpSendResponse {
    status: u16,
    status_text: String,
    headers: Vec<(String, String)>,
    body: String,
    body_base64: bool,
    /// True when the body was cut off at [`MAX_RESPONSE_BYTES`].
    truncated: bool,
    elapsed_ms: u64,
    size_bytes: u64,
}

/// Send `request` over the network and return the response.
///
/// Returns `Err(String)` only for transport-level failures (DNS, TLS, timeout,
/// connection refused). HTTP error statuses (4xx/5xx) are returned as a normal
/// [`HttpSendResponse`] so the UI can display them like any other response.
#[tauri::command]
pub async fn http_send(
    request: HttpRequest,
    timeout_ms: Option<u64>,
) -> Result<HttpSendResponse, String> {
    tauri::async_runtime::spawn_blocking(move || send_blocking(request, timeout_ms))
        .await
        .map_err(|e| e.to_string())?
}

fn send_blocking(request: HttpRequest, timeout_ms: Option<u64>) -> Result<HttpSendResponse, String> {
    let wire = build_wire(&request).map_err(|e| e.to_string())?;

    let agent = ureq::AgentBuilder::new()
        .timeout(Duration::from_millis(timeout_ms.unwrap_or(DEFAULT_TIMEOUT_MS)))
        .build();

    let mut req = agent.request(&wire.method, &wire.url);
    for (k, v) in &wire.headers {
        req = req.set(k, v);
    }

    let start = Instant::now();
    let result = match &wire.body {
        Some(bytes) => req.send_bytes(bytes),
        None => req.call(),
    };

    // A non-2xx status is reported via `Error::Status`; surface it as a normal
    // response rather than an error so the UI can render it.
    let response = match result {
        Ok(r) => r,
        Err(ureq::Error::Status(_, r)) => r,
        Err(err) => return Err(err.to_string()),
    };

    let elapsed_ms = start.elapsed().as_millis() as u64;
    let status = response.status();
    let status_text = response.status_text().to_string();

    // Read headers before `into_reader` consumes the response.
    let headers: Vec<(String, String)> = response
        .headers_names()
        .iter()
        .filter_map(|name| response.header(name).map(|v| (name.clone(), v.to_string())))
        .collect();

    let mut buf = Vec::new();
    response
        .into_reader()
        .take(MAX_RESPONSE_BYTES + 1)
        .read_to_end(&mut buf)
        .map_err(|e| e.to_string())?;

    let truncated = buf.len() as u64 > MAX_RESPONSE_BYTES;
    if truncated {
        buf.truncate(MAX_RESPONSE_BYTES as usize);
    }
    let size_bytes = buf.len() as u64;

    // Prefer UTF-8 text; fall back to base64 for binary payloads.
    let (body, body_base64) = match String::from_utf8(buf) {
        Ok(text) => (text, false),
        Err(e) => (
            base64::engine::general_purpose::STANDARD.encode(e.into_bytes()),
            true,
        ),
    };

    Ok(HttpSendResponse {
        status,
        status_text,
        headers,
        body,
        body_base64,
        truncated,
        elapsed_ms,
        size_bytes,
    })
}
