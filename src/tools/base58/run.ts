import { base58Encode, base58Decode } from "./api";
import type { SegmentedOption } from "../../components/ui/Segmented";

export type Base58Mode = "encode" | "decode";

export const BASE58_MODES: ReadonlyArray<SegmentedOption<Base58Mode>> = [
  { value: "encode", label: "Encode" },
  { value: "decode", label: "Decode" },
];

export function runBase58(
  input: string,
  mode: Base58Mode,
): Promise<string> | null {
  if (input === "") return null;
  return mode === "encode" ? base58Encode(input) : base58Decode(input);
}
