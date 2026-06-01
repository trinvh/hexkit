import { pgpDecrypt, type DecryptResult } from "./api";

export function runDecrypt(
  ciphertext: string,
  privateKey: string,
  passphrase: string,
): Promise<DecryptResult> | null {
  if (ciphertext.trim() === "" || privateKey.trim() === "") return null;
  return pgpDecrypt(ciphertext, privateKey, passphrase);
}
