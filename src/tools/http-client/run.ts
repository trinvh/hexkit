import type { SegmentedOption } from "../../components/ui/Segmented";
import type { Body, BodyType, HttpRequest, Param } from "./types";

export const METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"] as const;
export type Method = (typeof METHODS)[number];

export const BODY_TYPES: ReadonlyArray<SegmentedOption<BodyType>> = [
  { value: "none", label: "None" },
  { value: "raw", label: "Raw" },
  { value: "form", label: "Form" },
  { value: "multipart", label: "Multipart" },
];

export type CodeTarget = "js" | "python" | "go" | "php" | "rust";
export const CODE_TARGETS: ReadonlyArray<{ value: CodeTarget; label: string }> = [
  { value: "js", label: "JavaScript" },
  { value: "python", label: "Python" },
  { value: "go", label: "Go" },
  { value: "php", label: "PHP" },
  { value: "rust", label: "Rust" },
];

/** A fresh, empty editable row. */
export function emptyParam(): Param {
  return { key: "", value: "", enabled: true };
}

/** Immutably set field `patch` on the row at `index`. */
export function updateRow(rows: Param[], index: number, patch: Partial<Param>): Param[] {
  return rows.map((row, i) => (i === index ? { ...row, ...patch } : row));
}

/** Immutably remove the row at `index`. */
export function removeRow(rows: Param[], index: number): Param[] {
  return rows.filter((_, i) => i !== index);
}

/** Append an empty row. */
export function addRow(rows: Param[]): Param[] {
  return [...rows, emptyParam()];
}

/** Count the enabled, non-empty rows — used for tab badges. */
export function activeCount(rows: Param[]): number {
  return rows.filter((r) => r.enabled && r.key.trim() !== "").length;
}

/** Assemble the body from the per-type editor state. */
export function buildBody(
  bodyType: BodyType,
  raw: string,
  rawContentType: string,
  formFields: Param[],
  multipartFields: Param[],
): Body {
  switch (bodyType) {
    case "raw":
      return { type: "raw", content: raw, contentType: rawContentType };
    case "form":
      return { type: "form", fields: formFields };
    case "multipart":
      return { type: "multipart", fields: multipartFields };
    case "none":
    default:
      return { type: "none" };
  }
}

/** Assemble a full request from the editor state. */
export function buildRequest(parts: {
  method: string;
  url: string;
  query: Param[];
  headers: Param[];
  body: Body;
}): HttpRequest {
  return {
    method: parts.method,
    url: parts.url.trim(),
    query: parts.query,
    headers: parts.headers,
    body: parts.body,
  };
}

/** Tailwind text colour class for an HTTP status code. */
export function statusClass(status: number): string {
  if (status >= 200 && status < 300) return "text-emerald-500";
  if (status >= 300 && status < 400) return "text-amber-500";
  if (status >= 400) return "text-accent";
  return "text-fg-muted";
}

/** Human-readable byte size. */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/** Pretty-print a JSON body if it parses; otherwise return it unchanged. */
export function prettyJson(text: string): string {
  try {
    return JSON.stringify(JSON.parse(text), null, 2);
  } catch {
    return text;
  }
}

/** Guess a CodeMirror language from a response's Content-Type. */
export function languageForContentType(
  contentType: string | undefined,
): "json" | "html" | "xml" | "css" | undefined {
  if (!contentType) return undefined;
  const ct = contentType.toLowerCase();
  if (ct.includes("json")) return "json";
  if (ct.includes("html")) return "html";
  if (ct.includes("xml")) return "xml";
  if (ct.includes("css")) return "css";
  return undefined;
}
