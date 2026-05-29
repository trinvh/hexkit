//! Pure, Tauri-independent logic for all Hexkit developer tools.
//!
//! Every tool's transformation lives here as a plain function returning
//! [`ToolResult`], so it can be unit-tested without a Tauri runtime. The
//! `src-tauri` crate exposes these as thin `#[tauri::command]` wrappers.

pub mod actions;
pub mod base64;
pub mod color;
pub mod cron;
pub mod csvjson;
pub mod deeplink;
pub mod detect;
mod error;
pub mod escape;
pub mod hash;
pub mod hex;
pub mod html;
pub mod ids;
pub mod inspector;
pub mod json;
pub mod jsx;
pub mod jwt;
pub mod lines;
pub mod lorem;
pub mod numbase;
pub mod php;
pub mod random;
pub mod sql;
pub mod svg;
pub mod textcase;
pub mod textdiff;
pub mod unixtime;
pub mod urls;
pub mod yaml;

pub use actions::run;
pub use deeplink::parse_deep_link;
pub use error::{ToolError, ToolResult};
