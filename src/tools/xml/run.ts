import { xmlBeautify, xmlMinify, xmlQuery } from "./api";
import type { SegmentedOption } from "../../components/ui/Segmented";

export type XmlMode = "beautify" | "minify";

export const XML_MODES: ReadonlyArray<SegmentedOption<XmlMode>> = [
  { value: "beautify", label: "Beautify" },
  { value: "minify", label: "Minify" },
];

export interface XmlOptions {
  xpath?: string;
}

/**
 * Beautify/minify XML, or filter it with an XPath expression when one is
 * given (XPath takes precedence). Returns `null` for blank input.
 */
export function runXml(
  input: string,
  mode: XmlMode,
  opts: XmlOptions = {},
): Promise<string> | null {
  if (input.trim() === "") return null;
  const xpath = opts.xpath?.trim() ?? "";
  if (xpath !== "") return xmlQuery(input, xpath);
  return mode === "beautify" ? xmlBeautify(input) : xmlMinify(input);
}
