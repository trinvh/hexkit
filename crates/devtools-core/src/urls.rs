//! URL percent-encoding / decoding (component semantics, like
//! `encodeURIComponent`). URL parsing lives alongside in a later phase.

use crate::error::{ToolError, ToolResult};
use percent_encoding::{percent_decode_str, utf8_percent_encode, AsciiSet, NON_ALPHANUMERIC};
use serde::{Deserialize, Serialize};
use serde_json::Value;
// `::url` is the external crate (this module is `urls`).
use ::url::Url;

/// Characters left unescaped by `encodeURIComponent`: unreserved + `!~*'()`.
const COMPONENT: &AsciiSet = &NON_ALPHANUMERIC
    .remove(b'-')
    .remove(b'_')
    .remove(b'.')
    .remove(b'!')
    .remove(b'~')
    .remove(b'*')
    .remove(b'\'')
    .remove(b'(')
    .remove(b')');

/// Percent-encode a URL component.
pub fn encode(input: &str) -> String {
    utf8_percent_encode(input, COMPONENT).to_string()
}

/// Percent-decode a URL component. Returns [`ToolError::InvalidInput`] when the
/// decoded bytes are not valid UTF-8.
pub fn decode(input: &str) -> ToolResult<String> {
    percent_decode_str(input)
        .decode_utf8()
        .map(|decoded| decoded.into_owned())
        .map_err(|_| ToolError::invalid_input("decoded bytes are not valid UTF-8"))
}

#[derive(Debug, Serialize, PartialEq, Eq)]
pub struct QueryParam {
    pub key: String,
    pub value: String,
}

#[derive(Debug, Serialize, PartialEq, Eq)]
pub struct ParsedUrl {
    pub scheme: String,
    pub username: String,
    pub password: String,
    pub host: String,
    pub port: String,
    pub path: String,
    pub query: String,
    pub fragment: String,
    pub query_params: Vec<QueryParam>,
}

/// Parse an absolute URL into its components. Returns
/// [`ToolError::InvalidInput`] when the URL cannot be parsed.
pub fn parse(input: &str) -> ToolResult<ParsedUrl> {
    let url = Url::parse(input.trim()).map_err(|e| ToolError::invalid_input(e.to_string()))?;
    Ok(ParsedUrl {
        scheme: url.scheme().to_string(),
        username: url.username().to_string(),
        password: url.password().unwrap_or("").to_string(),
        host: url.host_str().unwrap_or("").to_string(),
        port: url
            .port_or_known_default()
            .map(|p| p.to_string())
            .unwrap_or_default(),
        path: url.path().to_string(),
        query: url.query().unwrap_or("").to_string(),
        fragment: url.fragment().unwrap_or("").to_string(),
        query_params: url
            .query_pairs()
            .map(|(key, value)| QueryParam {
                key: key.into_owned(),
                value: value.into_owned(),
            })
            .collect(),
    })
}

#[derive(Deserialize)]
struct OneInput {
    input: String,
}

pub fn dispatch(action: &str, params: Value) -> ToolResult<Value> {
    let parsed: OneInput =
        serde_json::from_value(params).map_err(|e| ToolError::invalid_input(e.to_string()))?;
    match action {
        "url.encode" => Ok(Value::String(encode(&parsed.input))),
        "url.decode" => Ok(Value::String(decode(&parsed.input)?)),
        "url.parse" => {
            serde_json::to_value(parse(&parsed.input)?).map_err(|e| ToolError::other(e.to_string()))
        }
        _ => Err(ToolError::invalid_input(format!("unknown action: {action}"))),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn encodes_spaces_and_reserved() {
        assert_eq!(encode("a b"), "a%20b");
        assert_eq!(encode("a+b=c&d"), "a%2Bb%3Dc%26d");
    }

    #[test]
    fn leaves_unreserved_untouched() {
        assert_eq!(encode("aZ09-_.~!*'()"), "aZ09-_.~!*'()");
    }

    #[test]
    fn encodes_utf8() {
        assert_eq!(encode("café"), "caf%C3%A9");
    }

    #[test]
    fn decodes_percent_sequences() {
        assert_eq!(decode("a%20b").unwrap(), "a b");
        assert_eq!(decode("caf%C3%A9").unwrap(), "café");
        assert_eq!(decode("%2Bplus").unwrap(), "+plus");
    }

    #[test]
    fn round_trips() {
        let text = "key=value & spaces/?#";
        assert_eq!(decode(&encode(text)).unwrap(), text);
    }

    #[test]
    fn rejects_non_utf8() {
        assert!(matches!(decode("%FF%FE"), Err(ToolError::InvalidInput(_))));
    }

    #[test]
    fn handles_empty() {
        assert_eq!(encode(""), "");
        assert_eq!(decode("").unwrap(), "");
    }

    #[test]
    fn parses_full_url() {
        let parsed =
            parse("https://user:pass@example.com:8080/path/to?x=1&y=2#frag").unwrap();
        assert_eq!(parsed.scheme, "https");
        assert_eq!(parsed.username, "user");
        assert_eq!(parsed.password, "pass");
        assert_eq!(parsed.host, "example.com");
        assert_eq!(parsed.port, "8080");
        assert_eq!(parsed.path, "/path/to");
        assert_eq!(parsed.query, "x=1&y=2");
        assert_eq!(parsed.fragment, "frag");
        assert_eq!(
            parsed.query_params,
            vec![
                QueryParam { key: "x".into(), value: "1".into() },
                QueryParam { key: "y".into(), value: "2".into() },
            ]
        );
    }

    #[test]
    fn fills_known_default_port() {
        let parsed = parse("https://example.com").unwrap();
        assert_eq!(parsed.port, "443");
        assert_eq!(parsed.path, "/");
    }

    #[test]
    fn rejects_invalid_url() {
        assert!(matches!(parse("not a url"), Err(ToolError::InvalidInput(_))));
    }
}
