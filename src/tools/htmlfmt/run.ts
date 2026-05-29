import { htmlBeautify, htmlMinify } from "./api";
import type { SegmentedOption } from "../../components/ui/Segmented";

export type HtmlFmtMode = "beautify" | "minify";

export const HTML_FMT_MODES: ReadonlyArray<SegmentedOption<HtmlFmtMode>> = [
  { value: "beautify", label: "Beautify" },
  { value: "minify", label: "Minify" },
];

export function runHtmlFmt(
  input: string,
  mode: HtmlFmtMode,
): Promise<string> | null {
  if (input.trim() === "") return null;
  return mode === "beautify" ? htmlBeautify(input) : htmlMinify(input);
}
