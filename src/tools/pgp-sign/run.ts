import { pgpSign } from "./api";

export function runSign(
  data: string,
  privateKey: string,
  passphrase: string,
): Promise<string> | null {
  if (data === "" || privateKey.trim() === "") return null;
  return pgpSign(data, privateKey, passphrase);
}
