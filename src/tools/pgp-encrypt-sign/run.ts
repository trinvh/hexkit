import { pgpEncryptSign } from "./api";

export function runEncryptSign(
  input: string,
  recipientPublicKey: string,
  senderPrivateKey: string,
  passphrase: string,
): Promise<string> | null {
  if (input === "" || recipientPublicKey.trim() === "" || senderPrivateKey.trim() === "") {
    return null;
  }
  return pgpEncryptSign(input, recipientPublicKey, senderPrivateKey, passphrase);
}
