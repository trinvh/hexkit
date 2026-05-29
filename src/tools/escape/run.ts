import { backslashEscape, backslashUnescape } from "./api";
import type { SegmentedOption } from "../../components/ui/Segmented";

export type EscapeMode = "escape" | "unescape";

export const ESCAPE_MODES: ReadonlyArray<SegmentedOption<EscapeMode>> = [
  { value: "escape", label: "Escape" },
  { value: "unescape", label: "Unescape" },
];

export function runEscape(
  input: string,
  mode: EscapeMode,
): Promise<string> | null {
  if (input === "") return null;
  return mode === "escape" ? backslashEscape(input) : backslashUnescape(input);
}
