import { runAction } from "../../lib/ipc";

export interface Verification {
  valid: boolean;
  signer_fingerprint: string | null;
  reason: string | null;
}

export function pgpVerify(
  input: string,
  signature: string,
  public_key: string,
): Promise<Verification> {
  return runAction<Verification>("pgp.verify", { input, signature, public_key });
}
