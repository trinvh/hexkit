import { invoke } from "@tauri-apps/api/core";

/** Mirrors `devtools_core::ToolError` serialized over IPC. */
export interface ToolError {
  kind: string;
  message: string;
}

export function isToolError(value: unknown): value is ToolError {
  return (
    typeof value === "object" &&
    value !== null &&
    "kind" in value &&
    "message" in value &&
    typeof (value as ToolError).message === "string"
  );
}

/** Extract a human-readable message from anything thrown across the IPC boundary. */
export function errorMessage(error: unknown): string {
  if (isToolError(error)) return error.message;
  if (error instanceof Error) return error.message;
  return String(error);
}

/**
 * Invoke a tool by action id through the shared Rust dispatcher.
 * Rejects with a {@link ToolError} when the tool fails.
 */
export function runAction<TResult>(
  action: string,
  params: Record<string, unknown>,
): Promise<TResult> {
  return invoke<TResult>("run_action", { action, params });
}
