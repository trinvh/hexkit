import { runAction } from "../../lib/ipc";

export function pgpEncryptSign(
  input: string,
  public_key: string,
  private_key: string,
  passphrase: string,
): Promise<string> {
  return runAction<string>("pgp.encrypt_sign", {
    input,
    public_key,
    private_key,
    passphrase,
  });
}
