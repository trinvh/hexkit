//! HOTP (RFC 4226) and TOTP (RFC 6238) one-time passwords.
//!
//! The core stays pure and deterministic: callers pass the unix timestamp
//! rather than reading the clock here, so generation is reproducible and
//! testable against the RFC vectors.

use crate::error::{ToolError, ToolResult};
use hmac::digest::KeyInit;
use hmac::{Hmac, Mac};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use sha1::Sha1;
use sha2::{Sha256, Sha512};

/// Supported HMAC algorithms for HOTP/TOTP.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Deserialize, Serialize)]
pub enum Algorithm {
    #[serde(rename = "SHA1")]
    Sha1,
    #[serde(rename = "SHA256")]
    Sha256,
    #[serde(rename = "SHA512")]
    Sha512,
}

impl Algorithm {
    /// The label used in `otpauth://` URIs and OTP apps.
    fn label(self) -> &'static str {
        match self {
            Algorithm::Sha1 => "SHA1",
            Algorithm::Sha256 => "SHA256",
            Algorithm::Sha512 => "SHA512",
        }
    }
}

fn default_algorithm() -> Algorithm {
    Algorithm::Sha1
}

fn default_digits() -> u32 {
    6
}

fn default_period() -> u64 {
    30
}

/// Decode a Base32 (RFC 4648) string into bytes. Case-insensitive; tolerates
/// `=` padding and embedded whitespace. Returns [`ToolError::InvalidInput`] on
/// any character outside the Base32 alphabet.
fn base32_decode(input: &str) -> ToolResult<Vec<u8>> {
    const ALPHABET: &[u8; 32] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

    let mut out = Vec::new();
    let mut buffer: u32 = 0;
    let mut bits: u32 = 0;
    for ch in input.chars() {
        if ch == '=' || ch.is_whitespace() {
            continue;
        }
        let upper = ch.to_ascii_uppercase() as u8;
        let value = ALPHABET
            .iter()
            .position(|&c| c == upper)
            .ok_or_else(|| ToolError::invalid_input(format!("invalid Base32 character: {ch}")))?;
        buffer = (buffer << 5) | value as u32;
        bits += 5;
        if bits >= 8 {
            bits -= 8;
            out.push((buffer >> bits) as u8);
        }
    }
    Ok(out)
}

/// Compute the HOTP value (RFC 4226) for `counter` using dynamic truncation.
fn hotp(secret: &[u8], counter: u64, algorithm: Algorithm, digits: u32) -> u32 {
    let message = counter.to_be_bytes();

    macro_rules! truncate {
        ($hash:ty) => {{
            let mut mac =
                <Hmac<$hash>>::new_from_slice(secret).expect("HMAC accepts keys of any length");
            Mac::update(&mut mac, &message);
            let hs = mac.finalize().into_bytes();
            // RFC 4226 §5.3 dynamic truncation: low 4 bits of the last byte
            // select a 4-byte window, masked to 31 bits.
            let offset = (hs[hs.len() - 1] & 0x0f) as usize;
            ((hs[offset] as u32 & 0x7f) << 24)
                | ((hs[offset + 1] as u32) << 16)
                | ((hs[offset + 2] as u32) << 8)
                | (hs[offset + 3] as u32)
        }};
    }

    let binary = match algorithm {
        Algorithm::Sha1 => truncate!(Sha1),
        Algorithm::Sha256 => truncate!(Sha256),
        Algorithm::Sha512 => truncate!(Sha512),
    };
    binary % 10u32.pow(digits)
}

/// A generated TOTP code plus the seconds left in the current time step.
#[derive(Debug, Serialize, PartialEq, Eq)]
pub struct TotpCode {
    pub code: String,
    #[serde(rename = "secondsRemaining")]
    pub seconds_remaining: u64,
}

/// Generate the TOTP code (RFC 6238) for `timestamp` (unix seconds).
pub fn generate(
    secret: &str,
    algorithm: Algorithm,
    digits: u32,
    period: u64,
    timestamp: u64,
) -> ToolResult<TotpCode> {
    if !(1..=10).contains(&digits) {
        return Err(ToolError::invalid_input("digits must be between 1 and 10"));
    }
    if period == 0 {
        return Err(ToolError::invalid_input("period must be greater than zero"));
    }
    let key = base32_decode(secret)?;
    if key.is_empty() {
        return Err(ToolError::invalid_input("secret is empty"));
    }

    let counter = timestamp / period;
    let value = hotp(&key, counter, algorithm, digits);
    let code = format!("{value:0width$}", width = digits as usize);
    let seconds_remaining = period - (timestamp % period);
    Ok(TotpCode {
        code,
        seconds_remaining,
    })
}

/// Build an `otpauth://totp/...` provisioning URI for an authenticator app.
pub fn uri(
    secret: &str,
    issuer: &str,
    account: &str,
    algorithm: Algorithm,
    digits: u32,
    period: u64,
) -> ToolResult<String> {
    // Validate the secret so we never emit a URI that won't scan.
    let key = base32_decode(secret)?;
    if key.is_empty() {
        return Err(ToolError::invalid_input("secret is empty"));
    }
    if !(1..=10).contains(&digits) {
        return Err(ToolError::invalid_input("digits must be between 1 and 10"));
    }
    if period == 0 {
        return Err(ToolError::invalid_input("period must be greater than zero"));
    }

    let label = format!("{}:{}", encode(issuer), encode(account));
    Ok(format!(
        "otpauth://totp/{label}?secret={secret}&issuer={issuer}&algorithm={algorithm}&digits={digits}&period={period}",
        secret = encode(secret),
        issuer = encode(issuer),
        algorithm = algorithm.label(),
    ))
}

/// Minimal RFC 3986 percent-encoding for URI label and query values.
fn encode(value: &str) -> String {
    let mut out = String::with_capacity(value.len());
    for byte in value.bytes() {
        match byte {
            b'A'..=b'Z' | b'a'..=b'z' | b'0'..=b'9' | b'-' | b'_' | b'.' | b'~' => {
                out.push(byte as char);
            }
            other => out.push_str(&format!("%{other:02X}")),
        }
    }
    out
}

#[derive(Deserialize)]
struct GenerateParams {
    secret: String,
    #[serde(default = "default_algorithm")]
    algorithm: Algorithm,
    #[serde(default = "default_digits")]
    digits: u32,
    #[serde(default = "default_period")]
    period: u64,
    timestamp: u64,
}

#[derive(Deserialize)]
struct UriParams {
    secret: String,
    issuer: String,
    account: String,
    #[serde(default = "default_algorithm")]
    algorithm: Algorithm,
    #[serde(default = "default_digits")]
    digits: u32,
    #[serde(default = "default_period")]
    period: u64,
}

pub fn dispatch(action: &str, params: Value) -> ToolResult<Value> {
    match action {
        "totp.generate" => {
            let p: GenerateParams = serde_json::from_value(params)
                .map_err(|e| ToolError::invalid_input(e.to_string()))?;
            let code = generate(&p.secret, p.algorithm, p.digits, p.period, p.timestamp)?;
            serde_json::to_value(code).map_err(|e| ToolError::invalid_input(e.to_string()))
        }
        "totp.uri" => {
            let p: UriParams = serde_json::from_value(params)
                .map_err(|e| ToolError::invalid_input(e.to_string()))?;
            let uri = uri(&p.secret, &p.issuer, &p.account, p.algorithm, p.digits, p.period)?;
            Ok(Value::String(uri))
        }
        _ => Err(ToolError::invalid_input(format!("unknown action: {action}"))),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    // RFC 6238 reference secret: Base32 of ASCII "12345678901234567890".
    const SEED: &str = "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ";

    #[test]
    fn decodes_base32_seed() {
        assert_eq!(base32_decode(SEED).unwrap(), b"12345678901234567890");
    }

    #[test]
    fn decodes_base32_lowercase_and_whitespace() {
        let decoded = base32_decode("ge zd gn bv gy3t qojq gezdgnbvgy3tqojq").unwrap();
        assert_eq!(decoded, b"12345678901234567890");
    }

    #[test]
    fn rfc6238_sha1_at_t59() {
        // RFC 6238 Appendix B: time 59s, 8 digits, SHA-1 -> 94287082.
        let out = generate(SEED, Algorithm::Sha1, 8, 30, 59).unwrap();
        assert_eq!(out.code, "94287082");
        // 59 mod 30 == 29, so 1 second remains in the step.
        assert_eq!(out.seconds_remaining, 1);
    }

    #[test]
    fn rfc6238_sha1_six_digits_at_t59() {
        let out = generate(SEED, Algorithm::Sha1, 6, 30, 59).unwrap();
        assert_eq!(out.code, "287082");
    }

    #[test]
    fn rfc6238_sha1_at_t1111111109() {
        // RFC 6238 Appendix B: 1111111109s, 8 digits, SHA-1 -> 07081804.
        let out = generate(SEED, Algorithm::Sha1, 8, 30, 1111111109).unwrap();
        assert_eq!(out.code, "07081804");
    }

    #[test]
    fn pads_short_codes_with_zeroes() {
        let out = generate(SEED, Algorithm::Sha1, 6, 30, 59).unwrap();
        assert_eq!(out.code.len(), 6);
    }

    #[test]
    fn rejects_bad_base32() {
        assert!(matches!(
            generate("not base32!", Algorithm::Sha1, 6, 30, 0),
            Err(ToolError::InvalidInput(_))
        ));
    }

    #[test]
    fn rejects_empty_secret() {
        assert!(matches!(
            generate("", Algorithm::Sha1, 6, 30, 0),
            Err(ToolError::InvalidInput(_))
        ));
    }

    #[test]
    fn rejects_out_of_range_digits() {
        assert!(matches!(
            generate(SEED, Algorithm::Sha1, 0, 30, 0),
            Err(ToolError::InvalidInput(_))
        ));
        assert!(matches!(
            generate(SEED, Algorithm::Sha1, 11, 30, 0),
            Err(ToolError::InvalidInput(_))
        ));
    }

    #[test]
    fn rejects_zero_period() {
        assert!(matches!(
            generate(SEED, Algorithm::Sha1, 6, 0, 0),
            Err(ToolError::InvalidInput(_))
        ));
    }

    #[test]
    fn builds_otpauth_uri() {
        let uri = uri(SEED, "Hexkit", "alice@example.com", Algorithm::Sha1, 6, 30).unwrap();
        assert!(uri.starts_with("otpauth://totp/Hexkit:alice%40example.com?"));
        assert!(uri.contains(&format!("secret={SEED}")));
        assert!(uri.contains("issuer=Hexkit"));
        assert!(uri.contains("algorithm=SHA1"));
        assert!(uri.contains("digits=6"));
        assert!(uri.contains("period=30"));
    }

    #[test]
    fn uri_percent_encodes_spaces() {
        let uri = uri(SEED, "Big Corp", "user name", Algorithm::Sha256, 8, 60).unwrap();
        assert!(uri.contains("Big%20Corp:user%20name"));
        assert!(uri.contains("issuer=Big%20Corp"));
        assert!(uri.contains("algorithm=SHA256"));
    }

    #[test]
    fn uri_rejects_bad_secret() {
        assert!(matches!(
            uri("###", "I", "a", Algorithm::Sha1, 6, 30),
            Err(ToolError::InvalidInput(_))
        ));
    }

    #[test]
    fn dispatch_generate_returns_object() {
        let out = dispatch(
            "totp.generate",
            serde_json::json!({ "secret": SEED, "digits": 8, "timestamp": 59 }),
        )
        .unwrap();
        assert_eq!(out["code"], serde_json::json!("94287082"));
        assert_eq!(out["secondsRemaining"], serde_json::json!(1));
    }

    #[test]
    fn dispatch_generate_requires_timestamp() {
        let err = dispatch("totp.generate", serde_json::json!({ "secret": SEED })).unwrap_err();
        assert!(matches!(err, ToolError::InvalidInput(_)));
    }

    #[test]
    fn dispatch_uri_returns_string() {
        let out = dispatch(
            "totp.uri",
            serde_json::json!({ "secret": SEED, "issuer": "Hexkit", "account": "a" }),
        )
        .unwrap();
        assert!(out.as_str().unwrap().starts_with("otpauth://totp/"));
    }

    #[test]
    fn dispatch_unknown_action_is_invalid_input() {
        let err = dispatch("totp.nope", serde_json::json!({})).unwrap_err();
        assert!(matches!(err, ToolError::InvalidInput(_)));
    }
}
