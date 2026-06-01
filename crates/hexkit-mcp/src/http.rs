//! Streamable-HTTP transport — used by the desktop app's "Enable MCP server"
//! toggle to host the curated tools on a loopback port while the app is open.
//!
//! Gated behind the `http` feature so the stdio binary never pulls in axum.

use std::sync::Arc;

use rmcp::transport::streamable_http_server::session::local::LocalSessionManager;
use rmcp::transport::{StreamableHttpServerConfig, StreamableHttpService};
use tokio_util::sync::CancellationToken;

use crate::HexkitTools;

/// Path the MCP endpoint is mounted at (clients connect to `http://host:port/mcp`).
pub const MCP_PATH: &str = "/mcp";

/// Serve the curated tool set over Streamable HTTP on an already-bound
/// `listener` until `cancel` is triggered (graceful shutdown).
///
/// The listener is bound by the caller so port-in-use errors surface
/// synchronously before this future is spawned. rmcp's default host allow-list
/// (localhost / 127.0.0.1 / ::1) keeps the endpoint loopback-only.
pub async fn serve_http(
    listener: std::net::TcpListener,
    cancel: CancellationToken,
) -> std::io::Result<()> {
    listener.set_nonblocking(true)?;
    let listener = tokio::net::TcpListener::from_std(listener)?;

    let service = StreamableHttpService::new(
        || Ok::<_, std::io::Error>(HexkitTools::new()),
        Arc::new(LocalSessionManager::default()),
        StreamableHttpServerConfig::default().with_cancellation_token(cancel.clone()),
    );

    let app = axum::Router::new().nest_service(MCP_PATH, service);

    axum::serve(listener, app)
        .with_graceful_shutdown(async move { cancel.cancelled().await })
        .await
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::io::{Read, Write};
    use std::time::Duration;

    #[tokio::test]
    async fn serves_http_and_responds() {
        // Ephemeral loopback port — the std listener is already accepting into
        // the backlog the moment it binds, so no startup sleep is needed.
        let listener = std::net::TcpListener::bind("127.0.0.1:0").unwrap();
        let addr = listener.local_addr().unwrap();
        let cancel = CancellationToken::new();
        let server = tokio::spawn(serve_http(listener, cancel.clone()));

        let response = tokio::task::spawn_blocking(move || {
            let mut sock = std::net::TcpStream::connect(addr).unwrap();
            sock.set_read_timeout(Some(Duration::from_secs(2))).unwrap();
            sock.write_all(
                b"GET /mcp HTTP/1.1\r\nHost: 127.0.0.1\r\nConnection: close\r\n\r\n",
            )
            .unwrap();
            let mut buf = Vec::new();
            let _ = sock.read_to_end(&mut buf); // ends on close or read timeout
            String::from_utf8_lossy(&buf).into_owned()
        })
        .await
        .unwrap();

        cancel.cancel();
        let _ = server.await;

        assert!(
            response.starts_with("HTTP/1.1"),
            "expected an HTTP response from the MCP endpoint, got: {response:?}",
        );
    }
}
