//! In-app MCP server lifecycle.
//!
//! Hosts Hexkit's curated tool set (see `hexkit_mcp`) over a loopback
//! Streamable-HTTP endpoint while the user keeps the View → Settings toggle on.
//! The frontend store owns the enabled/port preference (persisted) and drives
//! these commands; nothing starts unless the user opts in.

use std::net::TcpListener;
use std::sync::Mutex;

use tauri::State;
use tokio_util::sync::CancellationToken;

/// Bookkeeping for the running server. Cancelling the token shuts the axum
/// server down gracefully and ends the spawned task.
struct Running {
    port: u16,
    cancel: CancellationToken,
}

/// Managed state: at most one server runs at a time.
#[derive(Default)]
pub struct McpState(Mutex<Option<Running>>);

/// What the frontend renders in the Settings panel.
#[derive(serde::Serialize, Clone)]
pub struct McpStatus {
    running: bool,
    port: Option<u16>,
    url: Option<String>,
}

fn status_of(running: &Option<Running>) -> McpStatus {
    match running {
        Some(r) => McpStatus {
            running: true,
            port: Some(r.port),
            url: Some(format!("http://127.0.0.1:{}/mcp", r.port)),
        },
        None => McpStatus {
            running: false,
            port: None,
            url: None,
        },
    }
}

#[tauri::command]
pub fn mcp_status(state: State<'_, McpState>) -> McpStatus {
    let guard = state.0.lock().expect("mcp state poisoned");
    status_of(&guard)
}

/// Start (or, if already running on a different port, restart) the loopback
/// MCP server. Binds synchronously so "address already in use" surfaces here.
#[tauri::command]
pub fn mcp_start(state: State<'_, McpState>, port: u16) -> Result<McpStatus, String> {
    let mut guard = state.0.lock().expect("mcp state poisoned");

    if let Some(running) = guard.as_ref() {
        if running.port == port {
            return Ok(status_of(&guard)); // already serving on this port
        }
        running.cancel.cancel(); // port changed → stop the old listener first
        *guard = None;
    }

    let listener = TcpListener::bind(("127.0.0.1", port))
        .map_err(|e| format!("could not bind 127.0.0.1:{port}: {e}"))?;

    let cancel = CancellationToken::new();
    let cancel_for_task = cancel.clone();
    tauri::async_runtime::spawn(async move {
        if let Err(err) = hexkit_mcp::serve_http(listener, cancel_for_task).await {
            eprintln!("[hexkit-mcp] server stopped with error: {err}");
        }
    });

    *guard = Some(Running { port, cancel });
    Ok(status_of(&guard))
}

#[tauri::command]
pub fn mcp_stop(state: State<'_, McpState>) -> McpStatus {
    let mut guard = state.0.lock().expect("mcp state poisoned");
    if let Some(running) = guard.take() {
        running.cancel.cancel();
    }
    status_of(&guard)
}
