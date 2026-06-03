/** Mirrors `devtools_core::httpreq` (camelCase over the IPC boundary). */

export interface Param {
  key: string;
  value: string;
  enabled: boolean;
}

export type Body =
  | { type: "none" }
  | { type: "raw"; content: string; contentType: string }
  | { type: "form"; fields: Param[] }
  | { type: "multipart"; fields: Param[] };

export interface HttpRequest {
  method: string;
  /** Base URL without the query string; params live in `query`. */
  url: string;
  query: Param[];
  headers: Param[];
  body: Body;
}

/** Mirrors `http_client::HttpSendResponse` from the Tauri shell. */
export interface HttpResponse {
  status: number;
  statusText: string;
  headers: [string, string][];
  /** UTF-8 text, or base64 when `bodyBase64` is true. */
  body: string;
  bodyBase64: boolean;
  truncated: boolean;
  elapsedMs: number;
  sizeBytes: number;
}

export type BodyType = Body["type"];
