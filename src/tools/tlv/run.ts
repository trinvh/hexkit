import { tlvDecode, type TlvNode } from "./api";

export function runTlv(input: string): Promise<TlvNode[]> | null {
  if (input.trim() === "") return null;
  return tlvDecode(input);
}
