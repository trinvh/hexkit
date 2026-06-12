import { tlvDecode, type TlvEncoding, type TlvNode } from "./api";
import type { SegmentedOption } from "../../components/ui/Segmented";

export const TLV_ENCODINGS: ReadonlyArray<SegmentedOption<TlvEncoding>> = [
  { value: "hex", label: "HEX" },
  { value: "base64", label: "Base64" },
];

export function runTlv(
  input: string,
  encoding: TlvEncoding,
): Promise<TlvNode[]> | null {
  if (input.trim() === "") return null;
  return tlvDecode(input, encoding);
}
