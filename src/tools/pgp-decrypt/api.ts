import { runAction } from "../../lib/ipc";

export interface DecryptResult {
  plaintext: string;
}

export function pgpDecrypt(
  input: string,
  private_key: string,
  passphrase: string,
): Promise<DecryptResult> {
  return runAction<DecryptResult>("pgp.decrypt", { input, private_key, passphrase });
}
