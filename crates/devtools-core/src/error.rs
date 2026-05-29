use serde::Serialize;

/// Error type shared by every tool. Serializes to a tagged object so the
/// frontend can discriminate on `kind` and surface `message` to the user.
#[derive(Debug, Clone, PartialEq, Eq, thiserror::Error, Serialize)]
#[serde(tag = "kind", content = "message", rename_all = "snake_case")]
pub enum ToolError {
    /// Input failed validation or could not be parsed.
    #[error("invalid input: {0}")]
    InvalidInput(String),

    /// A tool-specific failure that does not fit a more precise variant.
    #[error("{0}")]
    Other(String),
}

impl ToolError {
    pub fn invalid_input(message: impl Into<String>) -> Self {
        Self::InvalidInput(message.into())
    }

    pub fn other(message: impl Into<String>) -> Self {
        Self::Other(message.into())
    }
}

pub type ToolResult<T> = Result<T, ToolError>;
