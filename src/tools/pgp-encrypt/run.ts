import { pgpEncrypt } from "./api";

export function runEncrypt(input: string, publicKey: string): Promise<string> | null {
  if (input === "" || publicKey.trim() === "") return null;
  return pgpEncrypt(input, publicKey);
}
