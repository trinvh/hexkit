import { pgpKeygen, type Keypair } from "./api";

/** Generate a keypair only when a non-blank user id is provided. */
export function runKeygen(
  user_id: string,
  passphrase: string,
): Promise<Keypair> | null {
  if (user_id.trim() === "") return null;
  return pgpKeygen(user_id, passphrase);
}
