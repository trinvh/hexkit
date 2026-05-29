import { xmlBeautify, xmlMinify } from "./api";
import type { SegmentedOption } from "../../components/ui/Segmented";

export type XmlMode = "beautify" | "minify";

export const XML_MODES: ReadonlyArray<SegmentedOption<XmlMode>> = [
  { value: "beautify", label: "Beautify" },
  { value: "minify", label: "Minify" },
];

export function runXml(input: string, mode: XmlMode): Promise<string> | null {
  if (input.trim() === "") return null;
  return mode === "beautify" ? xmlBeautify(input) : xmlMinify(input);
}
