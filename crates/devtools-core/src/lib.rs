//! Pure, Tauri-independent logic for all Hexkit developer tools.
//!
//! Every tool's transformation lives here as a plain function returning
//! [`ToolResult`], so it can be unit-tested without a Tauri runtime. The
//! `src-tauri` crate exposes these as thin `#[tauri::command]` wrappers.

pub mod actions;
pub mod base64;
pub mod color;
pub mod cron;
pub mod css;
pub mod csvjson;
pub mod curlcode;
pub mod deeplink;
pub mod detect;
mod error;
pub mod escape;
pub mod hash;
pub mod hex;
pub mod html;
pub mod htmlfmt;
pub mod ids;
pub mod inspector;
pub mod js;
pub mod json;
pub mod jsoncode;
pub mod jsx;
pub mod jwt;
pub mod lines;
pub mod lorem;
pub mod markdown;
pub mod numbase;
pub mod php;
pub mod qr;
pub mod random;
pub mod regexp;
pub mod sql;
pub mod svg;
pub mod textcase;
pub mod textdiff;
pub mod unixtime;
pub mod urls;
pub mod x509;
pub mod xml;
pub mod yaml;

pub use actions::run;
pub use deeplink::parse_deep_link;
pub use error::{ToolError, ToolResult};
