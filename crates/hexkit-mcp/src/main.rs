//! `hexkit-mcp` — a stdio Model Context Protocol server for Hexkit's tools.
//!
//! Launched by an MCP client (Claude Desktop, Cursor, Cline, …) over stdio.
//! It speaks MCP on stdin/stdout, so anything written to stdout must be
//! protocol traffic — diagnostics go to stderr only.

use hexkit_mcp::HexkitTools;
use rmcp::transport::stdio;
use rmcp::ServiceExt;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Serve the curated tool set over stdin/stdout and wait until the client
    // disconnects. All logging must go to stderr to keep stdout clean for MCP.
    let service = HexkitTools::new().serve(stdio()).await?;
    service.waiting().await?;
    Ok(())
}
