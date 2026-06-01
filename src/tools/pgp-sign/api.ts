import { runAction } from "../../lib/ipc";

export function pgpSign(
  input: string,
  private_key: string,
  passphrase: string,
): Promise<string> {
  return runAction<string>("pgp.sign", { input, private_key, passphrase });
}
