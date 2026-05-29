import { urlDecode, urlEncode } from "./api";
import type { SegmentedOption } from "../../components/ui/Segmented";

export type UrlMode = "encode" | "decode";

export const URL_MODES: ReadonlyArray<SegmentedOption<UrlMode>> = [
  { value: "encode", label: "Encode" },
  { value: "decode", label: "Decode" },
];

export function runUrl(input: string, mode: UrlMode): Promise<string> | null {
  if (input === "") return null;
  return mode === "encode" ? urlEncode(input) : urlDecode(input);
}
