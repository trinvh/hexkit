//! App update check.
//!
//! The GitHub Releases API is queried from Rust (not the webview `fetch`) so we
//! can send a `User-Agent` header — GitHub answers **403** to API requests that
//! lack one, which the browser `fetch` cannot set. The frontend
//! (`src/lib/updateCheck.ts`) parses the returned body and decides what to show.

const RELEASES_URL: &str = "https://api.github.com/repos/trinvh/hexkit/releases?per_page=30";

/// Raw probe result handed back to the frontend: the HTTP status and body (so
/// the UI can branch on 404 / 2xx exactly as it did with `fetch`), plus
/// rate-limit info so it can say *when* to retry on a 403.
#[derive(serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ReleasesProbe {
    status: u16,
    body: String,
    /// True when GitHub refused because the API rate limit is exhausted —
    /// status 403 (primary) or 429 (secondary) with `x-ratelimit-remaining: 0`.
    rate_limited: bool,
    /// Unix epoch (seconds) when the limit resets, from `x-ratelimit-reset`.
    rate_limit_reset: Option<u64>,
}

/// Build a probe from a response, reading the rate-limit headers before the
/// body consumes it. Works for both success and error (`Status`) responses.
fn probe_from(response: ureq::Response) -> Result<ReleasesProbe, String> {
    let status = response.status();
    let remaining = response
        .header("x-ratelimit-remaining")
        .and_then(|v| v.parse::<i64>().ok());
    let rate_limit_reset = response
        .header("x-ratelimit-reset")
        .and_then(|v| v.parse::<u64>().ok());
    let rate_limited = matches!(status, 403 | 429) && remaining == Some(0);
    let body = response.into_string().map_err(|e| e.to_string())?;
    Ok(ReleasesProbe {
        status,
        body,
        rate_limited,
        rate_limit_reset,
    })
}

#[tauri::command]
pub fn fetch_latest_releases() -> Result<ReleasesProbe, String> {
    let user_agent = concat!(
        "hexkit/",
        env!("CARGO_PKG_VERSION"),
        " (+https://github.com/trinvh/hexkit)"
    );

    let request = ureq::get(RELEASES_URL)
        .set("User-Agent", user_agent)
        .set("Accept", "application/vnd.github+json")
        .set("X-GitHub-Api-Version", "2022-11-28");

    match request.call() {
        Ok(response) => probe_from(response),
        // GitHub replied with a non-2xx (e.g. 403 rate limit, 404 missing repo).
        // Surface it instead of erroring so the UI can branch.
        Err(ureq::Error::Status(_, response)) => probe_from(response),
        // Transport/DNS/TLS failure — there is no HTTP status to report.
        Err(err) => Err(err.to_string()),
    }
}
