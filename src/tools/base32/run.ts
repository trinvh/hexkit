import { base32Encode, base32Decode } from "./api";
import type { SegmentedOption } from "../../components/ui/Segmented";

export type Base32Mode = "encode" | "decode";

export const BASE32_MODES: ReadonlyArray<SegmentedOption<Base32Mode>> = [
  { value: "encode", label: "Encode" },
  { value: "decode", label: "Decode" },
];

export function runBase32(
  input: string,
  mode: Base32Mode,
): Promise<string> | null {
  if (input === "") return null;
  return mode === "encode" ? base32Encode(input) : base32Decode(input);
}
