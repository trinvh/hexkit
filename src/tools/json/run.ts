import { jsonFormat, jsonMinify, type JsonIndent } from "./api";
import type { SegmentedOption } from "../../components/ui/Segmented";

export type JsonMode = JsonIndent | "minify";

export const JSON_MODES: ReadonlyArray<SegmentedOption<JsonMode>> = [
  { value: "  ", label: "2 spaces" },
  { value: "    ", label: "4 spaces" },
  { value: "\t", label: "Tab" },
  { value: "minify", label: "Minify" },
];

/**
 * Pick the transform for the given input + mode, or `null` when there is
 * nothing to do (blank input) so the caller can skip the IPC round-trip.
 */
export function runJson(input: string, mode: JsonMode): Promise<string> | null {
  if (input.trim() === "") return null;
  if (mode === "minify") return jsonMinify(input);
  return jsonFormat(input, mode);
}
