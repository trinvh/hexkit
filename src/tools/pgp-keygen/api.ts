import { runAction } from "../../lib/ipc";

export interface Keypair {
  private_key: string;
  public_key: string;
  fingerprint: string;
}

export function pgpKeygen(user_id: string, passphrase: string): Promise<Keypair> {
  return runAction<Keypair>("pgp.keygen", { user_id, passphrase });
}
