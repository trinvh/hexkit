import { base64Decode, base64Encode } from "./api";
import type { SegmentedOption } from "../../components/ui/Segmented";

export type Base64Mode = "encode" | "decode";

export const BASE64_MODES: ReadonlyArray<SegmentedOption<Base64Mode>> = [
  { value: "encode", label: "Encode" },
  { value: "decode", label: "Decode" },
];

/** Encode or decode `input`, or `null` when there is nothing to do. */
export function runBase64(input: string, mode: Base64Mode): Promise<string> | null {
  if (input === "") return null;
  return mode === "encode" ? base64Encode(input) : base64Decode(input);
}
