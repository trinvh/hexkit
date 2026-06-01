import { invoke } from "@tauri-apps/api/core";
import { isTauri } from "./cli";

/** Default loopback port for the in-app MCP server. */
export const DEFAULT_MCP_PORT = 7676;

/** Mirrors `mcp_server::McpStatus` on the Rust side. */
export interface McpStatus {
  running: boolean;
  port: number | null;
  url: string | null;
}

const STOPPED: McpStatus = { running: false, port: null, url: null };

/** Current server status (stopped when running outside Tauri). */
export async function mcpStatus(): Promise<McpStatus> {
  if (!isTauri()) return STOPPED;
  return invoke<McpStatus>("mcp_status");
}

/** Start (or restart on a new port) the loopback MCP server. */
export async function mcpStart(port: number): Promise<McpStatus> {
  if (!isTauri()) return STOPPED;
  return invoke<McpStatus>("mcp_start", { port });
}

/** Stop the MCP server. */
export async function mcpStop(): Promise<McpStatus> {
  if (!isTauri()) return STOPPED;
  return invoke<McpStatus>("mcp_stop");
}
