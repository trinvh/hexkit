import { runAction } from "../../lib/ipc";

export type PwAlgorithm = "bcrypt" | "argon2";

export interface HashResult {
  hash: string;
}

export interface VerifyResult {
  valid: boolean;
}

export function pwHash(
  algorithm: PwAlgorithm,
  password: string,
  cost?: number,
): Promise<HashResult> {
  return runAction<HashResult>("pwhash.hash", { algorithm, password, cost });
}

export function pwVerify(
  algorithm: PwAlgorithm,
  password: string,
  hash: string,
): Promise<VerifyResult> {
  return runAction<VerifyResult>("pwhash.verify", {
    algorithm,
    password,
    hash,
  });
}
