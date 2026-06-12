import { hexDecode, hexEncode } from "./api";
import type { SegmentedOption } from "../../components/ui/Segmented";

export type HexMode = "encode" | "decode";
export type HexCase = "upper" | "lower";

export const HEX_MODES: ReadonlyArray<SegmentedOption<HexMode>> = [
  { value: "encode", label: "ASCII → Hex" },
  { value: "decode", label: "Hex → ASCII" },
];

export const HEX_CASE_OPTIONS: ReadonlyArray<SegmentedOption<HexCase>> = [
  { value: "upper", label: "UPPER" },
  { value: "lower", label: "lower" },
];

export function runHex(
  input: string,
  mode: HexMode,
  hexCase: HexCase,
  delimiter: string,
): Promise<string> | null {
  if (input === "") return null;
  return mode === "encode"
    ? hexEncode(input, hexCase === "upper", delimiter)
    : hexDecode(input);
}
