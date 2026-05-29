import { jsonFormat, jsonMinify, jsonQuery, type JsonIndent } from "./api";
import type { SegmentedOption } from "../../components/ui/Segmented";

export type JsonMode = JsonIndent | "minify";

export const JSON_MODES: ReadonlyArray<SegmentedOption<JsonMode>> = [
  { value: "  ", label: "2 spaces" },
  { value: "    ", label: "4 spaces" },
  { value: "\t", label: "Tab" },
  { value: "minify", label: "Minify" },
];

export interface JsonOptions {
  sort?: boolean;
  path?: string;
}

/** Indent used for query/pretty output — falls back to 2 spaces in minify mode. */
function indentFor(mode: JsonMode): JsonIndent {
  return mode === "minify" ? "  " : mode;
}

/**
 * Pick the transform for the given input + mode + options, or `null` when there
 * is nothing to do (blank input) so the caller can skip the IPC round-trip.
 *
 * A non-empty JSONPath takes precedence over format/minify.
 */
export function runJson(
  input: string,
  mode: JsonMode,
  opts: JsonOptions = {},
): Promise<string> | null {
  if (input.trim() === "") return null;
  const path = opts.path?.trim() ?? "";
  if (path !== "") return jsonQuery(input, path, indentFor(mode));
  if (mode === "minify") return jsonMinify(input);
  return jsonFormat(input, mode, opts.sort ?? false);
}
