//! Model Context Protocol server exposing a **curated** subset of Hexkit's
//! tools to LLM agents.
//!
//! Design goals:
//! - **Small surface.** Only the deterministic / spec-heavy operations where an
//!   LLM is unreliable on its own (crypto, certificates, EMV-TLV, cron, exact
//!   hashing, ID generation). Trivial transforms an agent already does well
//!   (JSON pretty-print, base64, case conversion …) are deliberately omitted so
//!   the tool list stays tiny and cheap on the client's context window.
//! - **One dispatcher.** Every tool is a thin wrapper over
//!   `devtools_core::run(action, params)` — the same entry point the desktop
//!   app, the CLI and the `hexkit://` deep links use. Adding/removing a tool is
//!   a few lines here; the logic never moves out of `devtools-core`.

use rmcp::handler::server::wrapper::Parameters;
use rmcp::model::{CallToolResult, Content};
use rmcp::{schemars, tool, tool_handler, tool_router, ServerHandler};
use serde::Deserialize;
use serde_json::{json, Value};

#[cfg(feature = "http")]
mod http;
#[cfg(feature = "http")]
pub use http::{serve_http, MCP_PATH};

/// The MCP server. Holds the generated tool router.
#[derive(Clone)]
pub struct HexkitTools {
    tool_router: rmcp::handler::server::router::tool::ToolRouter<Self>,
}

impl Default for HexkitTools {
    fn default() -> Self {
        Self::new()
    }
}

/// Run a Hexkit action and turn the result into an MCP tool result.
///
/// Tool-level failures become an `is_error` result (model-visible and
/// recoverable) rather than a protocol error, so the agent can read the message
/// and retry with corrected input.
fn dispatch(action: &str, params: Value) -> CallToolResult {
    match devtools_core::run(action, params) {
        Ok(Value::String(text)) => CallToolResult::success(vec![Content::text(text)]),
        Ok(other) => {
            let text =
                serde_json::to_string_pretty(&other).unwrap_or_else(|_| other.to_string());
            CallToolResult::success(vec![Content::text(text)])
        }
        Err(err) => CallToolResult::error(vec![Content::text(err.to_string())]),
    }
}

#[tool_router]
impl HexkitTools {
    pub fn new() -> Self {
        Self {
            tool_router: Self::tool_router(),
        }
    }

    // ---- JSON Web Tokens --------------------------------------------------

    #[tool(
        name = "jwt_decode",
        description = "Decode a JWT into its header, payload and signature. Does not verify the signature."
    )]
    fn jwt_decode(&self, Parameters(p): Parameters<JwtDecode>) -> CallToolResult {
        dispatch("jwt.decode", json!({ "token": p.token }))
    }

    #[tool(
        name = "jwt_verify",
        description = "Verify a JWT's HMAC signature (HS256/384/512) against a shared secret. Returns validity and algorithm."
    )]
    fn jwt_verify(&self, Parameters(p): Parameters<JwtVerify>) -> CallToolResult {
        dispatch("jwt.verify", json!({ "token": p.token, "secret": p.secret }))
    }

    // ---- Hashing ----------------------------------------------------------

    #[tool(
        name = "hash",
        description = "Compute MD5, SHA-1, SHA-256 and SHA-512 hex digests of the input. Exact — never estimate a hash."
    )]
    fn hash(&self, Parameters(p): Parameters<HashInput>) -> CallToolResult {
        dispatch("hash.generate", json!({ "input": p.input }))
    }

    #[tool(
        name = "hmac",
        description = "Compute a keyed HMAC hex digest. algorithm is one of: md5, sha1, sha256, sha512."
    )]
    fn hmac(&self, Parameters(p): Parameters<HmacInput>) -> CallToolResult {
        dispatch(
            "hash.hmac",
            json!({ "algorithm": p.algorithm, "key": p.key, "message": p.message }),
        )
    }

    // ---- OpenPGP ----------------------------------------------------------

    #[tool(
        name = "pgp_keygen",
        description = "Generate an ASCII-armored Ed25519/Curve25519 OpenPGP key pair. Optional passphrase encrypts the private key."
    )]
    fn pgp_keygen(&self, Parameters(p): Parameters<PgpKeygen>) -> CallToolResult {
        dispatch(
            "pgp.keygen",
            json!({ "user_id": p.user_id, "passphrase": p.passphrase.unwrap_or_default() }),
        )
    }

    #[tool(
        name = "pgp_encrypt",
        description = "Encrypt a message to a recipient's ASCII-armored OpenPGP public key (AES-256)."
    )]
    fn pgp_encrypt(&self, Parameters(p): Parameters<PgpEncrypt>) -> CallToolResult {
        dispatch(
            "pgp.encrypt",
            json!({ "input": p.input, "public_key": p.public_key }),
        )
    }

    #[tool(
        name = "pgp_decrypt",
        description = "Decrypt an ASCII-armored OpenPGP message with a private key (and passphrase, if the key is protected)."
    )]
    fn pgp_decrypt(&self, Parameters(p): Parameters<PgpDecrypt>) -> CallToolResult {
        dispatch(
            "pgp.decrypt",
            json!({
                "input": p.input,
                "private_key": p.private_key,
                "passphrase": p.passphrase.unwrap_or_default(),
            }),
        )
    }

    #[tool(
        name = "pgp_sign",
        description = "Produce a detached, text-normalized OpenPGP signature over a message with a private key."
    )]
    fn pgp_sign(&self, Parameters(p): Parameters<PgpSign>) -> CallToolResult {
        dispatch(
            "pgp.sign",
            json!({
                "input": p.input,
                "private_key": p.private_key,
                "passphrase": p.passphrase.unwrap_or_default(),
            }),
        )
    }

    #[tool(
        name = "pgp_verify",
        description = "Verify a detached OpenPGP signature against the signer's public key. Returns validity and signer fingerprint."
    )]
    fn pgp_verify(&self, Parameters(p): Parameters<PgpVerify>) -> CallToolResult {
        dispatch(
            "pgp.verify",
            json!({ "input": p.input, "signature": p.signature, "public_key": p.public_key }),
        )
    }

    // ---- Certificates / binary formats -----------------------------------

    #[tool(
        name = "x509_decode",
        description = "Decode a PEM or DER X.509 certificate into subject, issuer, serial, validity window and signature algorithm."
    )]
    fn x509_decode(&self, Parameters(p): Parameters<TextInput>) -> CallToolResult {
        dispatch("x509.decode", json!({ "input": p.input }))
    }

    #[tool(
        name = "tlv_decode",
        description = "Parse BER-TLV / EMV chip-card data (hex) into a nested tag tree with EMV tag names."
    )]
    fn tlv_decode(&self, Parameters(p): Parameters<TextInput>) -> CallToolResult {
        dispatch("tlv.decode", json!({ "input": p.input }))
    }

    // ---- Scheduling -------------------------------------------------------

    #[tool(
        name = "cron_parse",
        description = "Explain a cron expression in English and break out each field. Use instead of guessing cron semantics."
    )]
    fn cron_parse(&self, Parameters(p): Parameters<TextInput>) -> CallToolResult {
        dispatch("cron.parse", json!({ "input": p.input }))
    }

    // ---- IDs --------------------------------------------------------------

    #[tool(
        name = "id_generate",
        description = "Generate real IDs (never fabricate one). kind: uuid_v4, uuid_v7, ulid or nano_id. count defaults to 1 (max 100)."
    )]
    fn id_generate(&self, Parameters(p): Parameters<IdGenerate>) -> CallToolResult {
        dispatch(
            "id.generate",
            json!({
                "kind": p.kind,
                "count": p.count.unwrap_or(1),
                "lowercased": p.lowercased.unwrap_or(false),
            }),
        )
    }
}

// `router = self.tool_router` reuses the router built once in `new()` instead
// of rebuilding it per call. `name` is set explicitly because the macro default
// (`Implementation::from_build_env()`) reports rmcp's own crate info; omitting
// `version` lets it expand `env!("CARGO_PKG_VERSION")` of *this* crate, so the
// version stays in lockstep with the workspace.
#[tool_handler(
    router = self.tool_router,
    name = "hexkit-mcp",
    instructions = "Hexkit's offline dev tools: deterministic OpenPGP, hashing/HMAC, JWT, X.509, BER-TLV/EMV, cron and ID generation. Prefer these over computing the result yourself."
)]
impl ServerHandler for HexkitTools {}

// ---------------------------------------------------------------------------
// Tool input schemas. Doc comments become the field descriptions the client
// shows the model, so keep them short and specific.
// ---------------------------------------------------------------------------

/// A single block of input text.
#[derive(Debug, Deserialize, schemars::JsonSchema)]
struct TextInput {
    /// The input to process (e.g. a PEM certificate, hex TLV string, or cron expression).
    input: String,
}

#[derive(Debug, Deserialize, schemars::JsonSchema)]
struct JwtDecode {
    /// The compact JWT string (`header.payload.signature`).
    token: String,
}

#[derive(Debug, Deserialize, schemars::JsonSchema)]
struct JwtVerify {
    /// The compact JWT string to verify.
    token: String,
    /// The shared HMAC secret the token was signed with.
    secret: String,
}

#[derive(Debug, Deserialize, schemars::JsonSchema)]
struct HashInput {
    /// The text to hash.
    input: String,
}

#[derive(Debug, Deserialize, schemars::JsonSchema)]
struct HmacInput {
    /// Hash algorithm: md5, sha1, sha256 or sha512.
    algorithm: String,
    /// The secret key.
    key: String,
    /// The message to authenticate.
    message: String,
}

#[derive(Debug, Deserialize, schemars::JsonSchema)]
struct PgpKeygen {
    /// User id for the key, e.g. "Alice <alice@example.com>".
    user_id: String,
    /// Optional passphrase to protect the private key.
    passphrase: Option<String>,
}

#[derive(Debug, Deserialize, schemars::JsonSchema)]
struct PgpEncrypt {
    /// Plaintext message to encrypt.
    input: String,
    /// Recipient's ASCII-armored OpenPGP public key.
    public_key: String,
}

#[derive(Debug, Deserialize, schemars::JsonSchema)]
struct PgpDecrypt {
    /// ASCII-armored PGP message to decrypt.
    input: String,
    /// Your ASCII-armored OpenPGP private key.
    private_key: String,
    /// Passphrase for the private key, if it is protected.
    passphrase: Option<String>,
}

#[derive(Debug, Deserialize, schemars::JsonSchema)]
struct PgpSign {
    /// Message to sign.
    input: String,
    /// Your ASCII-armored OpenPGP private key.
    private_key: String,
    /// Passphrase for the private key, if it is protected.
    passphrase: Option<String>,
}

#[derive(Debug, Deserialize, schemars::JsonSchema)]
struct PgpVerify {
    /// The signed message text.
    input: String,
    /// The detached ASCII-armored OpenPGP signature.
    signature: String,
    /// The signer's ASCII-armored OpenPGP public key.
    public_key: String,
}

#[derive(Debug, Deserialize, schemars::JsonSchema)]
struct IdGenerate {
    /// One of: uuid_v4, uuid_v7, ulid, nano_id.
    kind: String,
    /// How many to generate (default 1, max 100).
    count: Option<u32>,
    /// Lowercase the output (default false).
    lowercased: Option<bool>,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn hash_returns_known_sha256() {
        let result = dispatch("hash.generate", json!({ "input": "hi" }));
        let text = result_text(&result);
        // SHA-256("hi")
        assert!(text.contains("8f434346648f6b96df89dda901c5176b10a6d83961dd3c1ac88b59b2dc327aa4"));
        assert_ne!(result.is_error, Some(true));
    }

    #[test]
    fn id_generate_runs() {
        let result = dispatch("id.generate", json!({ "kind": "uuid_v4", "count": 1 }));
        assert_ne!(result.is_error, Some(true));
    }

    #[test]
    fn tool_error_is_surfaced_as_is_error() {
        // Unknown HMAC algorithm → tool-level error, not a panic.
        let result = dispatch(
            "hash.hmac",
            json!({ "algorithm": "sha3", "key": "k", "message": "m" }),
        );
        assert_eq!(result.is_error, Some(true));
    }

    fn result_text(result: &CallToolResult) -> String {
        result
            .content
            .iter()
            .filter_map(|c| c.as_text().map(|t| t.text.clone()))
            .collect::<Vec<_>>()
            .join("\n")
    }
}
