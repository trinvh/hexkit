import { pgpDecryptVerify, type DecryptVerifyResult } from "./api";

export function runDecryptVerify(
  ciphertext: string,
  recipientPrivateKey: string,
  passphrase: string,
  senderPublicKey: string,
): Promise<DecryptVerifyResult> | null {
  if (
    ciphertext.trim() === "" ||
    recipientPrivateKey.trim() === "" ||
    senderPublicKey.trim() === ""
  ) {
    return null;
  }
  return pgpDecryptVerify(ciphertext, recipientPrivateKey, passphrase, senderPublicKey);
}
