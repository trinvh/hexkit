import { cssBeautify, cssMinify } from "./api";
import type { SegmentedOption } from "../../components/ui/Segmented";

export type CssSyntax = "css" | "scss" | "less";
export type CssMode = "beautify" | "minify";

export const CSS_SYNTAXES: ReadonlyArray<SegmentedOption<CssSyntax>> = [
  { value: "css", label: "CSS" },
  { value: "scss", label: "SCSS" },
  { value: "less", label: "Less" },
];

export const CSS_MODES: ReadonlyArray<SegmentedOption<CssMode>> = [
  { value: "beautify", label: "Beautify" },
  { value: "minify", label: "Minify" },
];

export function runCss(
  input: string,
  syntax: CssSyntax,
  mode: CssMode,
): Promise<string> | null {
  if (input.trim() === "") return null;
  return mode === "beautify"
    ? cssBeautify(input, syntax)
    : cssMinify(input, syntax);
}
