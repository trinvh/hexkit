//! X.509 certificate decoding (PEM).

use crate::error::{ToolError, ToolResult};
use serde::{Deserialize, Serialize};
use serde_json::Value;

#[derive(Debug, Serialize)]
pub struct CertInfo {
    pub subject: String,
    pub issuer: String,
    pub serial: String,
    pub not_before: String,
    pub not_after: String,
    pub signature_algorithm: String,
    pub version: String,
}

/// Decode a PEM-encoded X.509 certificate into its key fields.
pub fn decode(input: &str) -> ToolResult<CertInfo> {
    if !input.contains("BEGIN CERTIFICATE") {
        return Err(ToolError::invalid_input(
            "expected a PEM-encoded certificate",
        ));
    }
    let block = pem::parse(input).map_err(|e| ToolError::invalid_input(e.to_string()))?;
    let der = block.into_contents();
    let (_, cert) = x509_parser::parse_x509_certificate(&der)
        .map_err(|e| ToolError::invalid_input(e.to_string()))?;

    Ok(CertInfo {
        subject: cert.subject().to_string(),
        issuer: cert.issuer().to_string(),
        serial: cert.raw_serial_as_string(),
        not_before: cert.validity().not_before.to_string(),
        not_after: cert.validity().not_after.to_string(),
        signature_algorithm: cert.signature_algorithm.algorithm.to_id_string(),
        version: cert.version().to_string(),
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
        "x509.decode" => {
            serde_json::to_value(decode(&parsed.input)?).map_err(|e| ToolError::other(e.to_string()))
        }
        _ => Err(ToolError::invalid_input(format!("unknown action: {action}"))),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn decodes_a_generated_certificate() {
        let generated =
            rcgen::generate_simple_self_signed(vec!["hexkit.example".to_string()]).unwrap();
        let pem = generated.cert.pem();
        let info = decode(&pem).unwrap();
        assert!(!info.serial.is_empty());
        assert!(!info.not_before.is_empty());
        assert!(!info.signature_algorithm.is_empty());
    }

    #[test]
    fn rejects_non_pem_input() {
        assert!(matches!(decode("not a cert"), Err(ToolError::InvalidInput(_))));
    }
}
