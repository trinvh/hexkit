import { runAction } from "../../lib/ipc";

export interface DecryptVerifyResult {
  plaintext: string;
  verification: {
    valid: boolean;
    signer_fingerprint: string | null;
    reason: string | null;
  };
}

export function pgpDecryptVerify(
  input: string,
  private_key: string,
  passphrase: string,
  public_key: string,
): Promise<DecryptVerifyResult> {
  return runAction<DecryptVerifyResult>("pgp.decrypt_verify", {
    input,
    private_key,
    passphrase,
    public_key,
  });
}
