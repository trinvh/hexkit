//! Pure, Tauri-independent logic for all Hexkit developer tools.
//!
//! Every tool's transformation lives here as a plain function returning
//! [`ToolResult`], so it can be unit-tested without a Tauri runtime. The
//! `src-tauri` crate exposes these as thin `#[tauri::command]` wrappers.

pub mod actions;
pub mod base64;
pub mod deeplink;
mod error;
pub mod hash;
pub mod html;
pub mod ids;
pub mod json;
pub mod jwt;
pub mod numbase;
pub mod textcase;
pub mod textdiff;
pub mod unixtime;
pub mod urls;

pub use actions::run;
pub use deeplink::parse_deep_link;
pub use error::{ToolError, ToolResult};
