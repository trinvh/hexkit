//! Convert a `curl` command into request code for several languages.

use crate::error::{ToolError, ToolResult};
use serde::Deserialize;
use serde_json::Value;

struct Request {
    url: String,
    method: String,
    headers: Vec<(String, String)>,
    body: Option<String>,
}

fn parse_curl(command: &str) -> ToolResult<Request> {
    let tokens =
        shell_words::split(command.trim()).map_err(|e| ToolError::invalid_input(e.to_string()))?;
    let mut iter = tokens.iter().peekable();
    if iter.peek().map(|s| s.as_str()) == Some("curl") {
        iter.next();
    }

    let mut url = None;
    let mut method = None;
    let mut headers = Vec::new();
    let mut body = None;

    while let Some(token) = iter.next() {
        match token.as_str() {
            "-X" | "--request" => method = iter.next().cloned(),
            "--url" => url = iter.next().cloned(),
            "-H" | "--header" => {
                if let Some((key, value)) = iter.next().and_then(|h| h.split_once(':')) {
                    headers.push((key.trim().to_string(), value.trim().to_string()));
                }
            }
            "-d" | "--data" | "--data-raw" | "--data-binary" | "--data-ascii" => {
                body = iter.next().cloned();
            }
            "-u" | "--user" => {
                if let Some(user) = iter.next() {
                    headers.push(("Authorization".to_string(), format!("Basic {}", crate::base64::encode(user))));
                }
            }
            flag if flag.starts_with('-') => {}
            positional => {
                if url.is_none() {
                    url = Some(positional.to_string());
                }
            }
        }
    }

    let url = url.ok_or_else(|| ToolError::invalid_input("no URL found in curl command"))?;
    let method = method
        .unwrap_or_else(|| if body.is_some() { "POST".to_string() } else { "GET".to_string() })
        .to_uppercase();
    Ok(Request { url, method, headers, body })
}

fn to_js(req: &Request) -> String {
    let mut headers = String::new();
    for (k, v) in &req.headers {
        headers.push_str(&format!("    {k:?}: {v:?},\n"));
    }
    let body = req
        .body
        .as_ref()
        .map(|b| format!("  body: {b:?},\n"))
        .unwrap_or_default();
    format!(
        "const response = await fetch({:?}, {{\n  method: {:?},\n  headers: {{\n{headers}  }},\n{body}}});\nconst data = await response.json();\n",
        req.url, req.method
    )
}

fn to_python(req: &Request) -> String {
    let mut headers = String::new();
    for (k, v) in &req.headers {
        headers.push_str(&format!("        {k:?}: {v:?},\n"));
    }
    let body = req
        .body
        .as_ref()
        .map(|b| format!("    data={b:?},\n"))
        .unwrap_or_default();
    format!(
        "import requests\n\nresponse = requests.request(\n    {:?},\n    {:?},\n    headers={{\n{headers}    }},\n{body})\nprint(response.json())\n",
        req.method, req.url
    )
}

fn to_go(req: &Request) -> String {
    let body = req
        .body
        .as_ref()
        .map(|b| format!("strings.NewReader({b:?})"))
        .unwrap_or_else(|| "nil".to_string());
    let mut headers = String::new();
    for (k, v) in &req.headers {
        headers.push_str(&format!("\treq.Header.Set({k:?}, {v:?})\n"));
    }
    format!(
        "req, _ := http.NewRequest({:?}, {:?}, {body})\n{headers}resp, _ := http.DefaultClient.Do(req)\ndefer resp.Body.Close()\n",
        req.method, req.url
    )
}

fn to_php(req: &Request) -> String {
    let mut headers = String::new();
    for (k, v) in &req.headers {
        headers.push_str(&format!("    \"{k}: {v}\",\n"));
    }
    let body = req
        .body
        .as_ref()
        .map(|b| format!("curl_setopt($ch, CURLOPT_POSTFIELDS, {b:?});\n"))
        .unwrap_or_default();
    format!(
        "$ch = curl_init({:?});\ncurl_setopt($ch, CURLOPT_CUSTOMREQUEST, {:?});\ncurl_setopt($ch, CURLOPT_RETURNTRANSFER, true);\ncurl_setopt($ch, CURLOPT_HTTPHEADER, [\n{headers}]);\n{body}$response = curl_exec($ch);\ncurl_close($ch);\n",
        req.url, req.method
    )
}

fn to_rust(req: &Request) -> String {
    let mut headers = String::new();
    for (k, v) in &req.headers {
        headers.push_str(&format!("    .header({k:?}, {v:?})\n"));
    }
    let body = req
        .body
        .as_ref()
        .map(|b| format!("    .body({b:?})\n"))
        .unwrap_or_default();
    format!(
        "let client = reqwest::blocking::Client::new();\nlet response = client\n    .request(reqwest::Method::{}, {:?})\n{headers}{body}    .send()?;\n",
        req.method, req.url
    )
}

/// Generate request code for `target` (js, python, go, php, rust).
pub fn to_code(command: &str, target: &str) -> ToolResult<String> {
    let req = parse_curl(command)?;
    match target {
        "js" => Ok(to_js(&req)),
        "python" => Ok(to_python(&req)),
        "go" => Ok(to_go(&req)),
        "php" => Ok(to_php(&req)),
        "rust" => Ok(to_rust(&req)),
        other => Err(ToolError::invalid_input(format!("unknown target: {other}"))),
    }
}

#[derive(Deserialize)]
struct CurlParams {
    command: String,
    target: String,
}

pub fn dispatch(action: &str, params: Value) -> ToolResult<Value> {
    let p: CurlParams =
        serde_json::from_value(params).map_err(|e| ToolError::invalid_input(e.to_string()))?;
    match action {
        "curl.to_code" => Ok(Value::String(to_code(&p.command, &p.target)?)),
        _ => Err(ToolError::invalid_input(format!("unknown action: {action}"))),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn generates_js_get() {
        let out = to_code("curl https://api.example.com", "js").unwrap();
        assert!(out.contains(r#"fetch("https://api.example.com""#));
        assert!(out.contains(r#"method: "GET""#));
    }

    #[test]
    fn infers_post_with_data_and_headers() {
        let out = to_code(
            r#"curl -H "Content-Type: application/json" -d '{"a":1}' https://api.example.com"#,
            "python",
        )
        .unwrap();
        assert!(out.contains("requests.request"));
        assert!(out.contains(r#""POST""#));
        assert!(out.contains("Content-Type"));
        assert!(out.contains("data="));
    }

    #[test]
    fn generates_each_language() {
        assert!(to_code("curl https://x.com", "go").unwrap().contains("http.NewRequest"));
        assert!(to_code("curl https://x.com", "php").unwrap().contains("curl_init"));
        assert!(to_code("curl https://x.com", "rust").unwrap().contains("reqwest"));
    }

    #[test]
    fn rejects_unknown_target() {
        assert!(matches!(
            to_code("curl https://x.com", "cobol"),
            Err(ToolError::InvalidInput(_))
        ));
    }

    #[test]
    fn rejects_missing_url() {
        assert!(matches!(to_code("curl -X GET", "js"), Err(ToolError::InvalidInput(_))));
    }
}
