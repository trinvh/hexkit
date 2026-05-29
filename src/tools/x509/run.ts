import { x509Decode, type CertInfo } from "./api";

export function runX509(input: string): Promise<CertInfo> | null {
  if (input.trim() === "") return null;
  return x509Decode(input);
}
