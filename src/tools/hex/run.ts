import { hexDecode, hexEncode } from "./api";
import type { SegmentedOption } from "../../components/ui/Segmented";

export type HexMode = "encode" | "decode";

export const HEX_MODES: ReadonlyArray<SegmentedOption<HexMode>> = [
  { value: "encode", label: "ASCII → Hex" },
  { value: "decode", label: "Hex → ASCII" },
];

export function runHex(input: string, mode: HexMode): Promise<string> | null {
  if (input === "") return null;
  return mode === "encode" ? hexEncode(input) : hexDecode(input);
}
