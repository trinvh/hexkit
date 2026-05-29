import { htmlDecode, htmlEncode } from "./api";
import type { SegmentedOption } from "../../components/ui/Segmented";

export type HtmlMode = "encode" | "decode";

export const HTML_MODES: ReadonlyArray<SegmentedOption<HtmlMode>> = [
  { value: "encode", label: "Encode" },
  { value: "decode", label: "Decode" },
];

export function runHtml(input: string, mode: HtmlMode): Promise<string> | null {
  if (input === "") return null;
  return mode === "encode" ? htmlEncode(input) : htmlDecode(input);
}
