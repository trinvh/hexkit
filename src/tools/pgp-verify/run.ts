import { pgpVerify, type Verification } from "./api";

export function runVerify(
  data: string,
  signature: string,
  publicKey: string,
): Promise<Verification> | null {
  if (data === "" || signature.trim() === "" || publicKey.trim() === "") {
    return null;
  }
  return pgpVerify(data, signature, publicKey);
}
