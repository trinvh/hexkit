import { hashGenerate, hashHmac, type Hashes } from "./api";

export function runHash(input: string): Promise<Hashes> | null {
  if (input === "") return null;
  return hashGenerate(input);
}

/**
 * Compute plain digests, or keyed HMAC digests across all algorithms when a
 * key is supplied. Returns `null` for empty input.
 */
export function runDigests(input: string, key: string): Promise<Hashes> | null {
  if (input === "") return null;
  if (key === "") return hashGenerate(input);
  return Promise.all([
    hashHmac("md5", key, input),
    hashHmac("sha1", key, input),
    hashHmac("sha256", key, input),
    hashHmac("sha512", key, input),
  ]).then(([md5, sha1, sha256, sha512]) => ({ md5, sha1, sha256, sha512 }));
}
