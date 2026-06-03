import { invoke } from "@tauri-apps/api/core";
import { runAction } from "../../lib/ipc";
import { curlToCode } from "../curlcode/api";
import type { HttpRequest, HttpResponse } from "./types";

/** Parse a curl command into a structured request (pure, offline). */
export function fromCurl(command: string): Promise<HttpRequest> {
  return runAction<HttpRequest>("httpreq.from_curl", { command });
}

/** Serialize a request back into a curl command (pure, offline). */
export function toCurl(request: HttpRequest): Promise<string> {
  return runAction<string>(
    "httpreq.to_curl",
    request as unknown as Record<string, unknown>,
  );
}

/**
 * Execute the request over the network. This is the one IPC call in Hexkit that
 * leaves the machine — it goes to the dedicated `http_send` Tauri command, not
 * the offline `run_action` dispatcher.
 */
export function sendRequest(
  request: HttpRequest,
  timeoutMs?: number,
): Promise<HttpResponse> {
  return invoke<HttpResponse>("http_send", { request, timeoutMs });
}

/** Export the request as request code for `target`, via its curl form. */
export async function toCode(
  request: HttpRequest,
  target: string,
): Promise<string> {
  const curl = await toCurl(request);
  return curlToCode(curl, target);
}
