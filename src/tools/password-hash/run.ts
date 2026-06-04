import { pwHash, pwVerify, type HashResult, type PwAlgorithm } from "./api";
import type { SegmentedOption } from "../../components/ui/Segmented";

export type PwMode = "hash" | "verify";

export const PW_ALGORITHMS: ReadonlyArray<SegmentedOption<PwAlgorithm>> = [
  { value: "bcrypt", label: "bcrypt" },
  { value: "argon2", label: "Argon2" },
];

export const PW_MODES: ReadonlyArray<SegmentedOption<PwMode>> = [
  { value: "hash", label: "Hash" },
  { value: "verify", label: "Verify" },
];

/** Hash `password` with `algorithm`. Returns `null` for empty input. */
export function runHash(
  algorithm: PwAlgorithm,
  password: string,
): Promise<HashResult> | null {
  if (password === "") return null;
  return pwHash(algorithm, password);
}

/**
 * Verify `password` against `hash`, resolving to "valid"/"invalid". Returns
 * `null` until both the password and the hash are present.
 */
export function runVerify(
  algorithm: PwAlgorithm,
  password: string,
  hash: string,
): Promise<string> | null {
  if (password === "" || hash === "") return null;
  return pwVerify(algorithm, password, hash).then((r) =>
    r.valid ? "valid" : "invalid",
  );
}
