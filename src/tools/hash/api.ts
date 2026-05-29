import { runAction } from "../../lib/ipc";

export interface Hashes {
  md5: string;
  sha1: string;
  sha256: string;
  sha512: string;
}

export function hashGenerate(input: string): Promise<Hashes> {
  return runAction<Hashes>("hash.generate", { input });
}

export function hashHmac(
  algorithm: string,
  key: string,
  message: string,
): Promise<string> {
  return runAction<string>("hash.hmac", { algorithm, key, message });
}
