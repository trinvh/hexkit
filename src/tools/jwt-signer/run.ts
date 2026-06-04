import { jwtSign, type JwtAlgorithm } from "./api";
import type { SegmentedOption } from "../../components/ui/Segmented";

export const JWT_ALGORITHMS: ReadonlyArray<SegmentedOption<JwtAlgorithm>> = [
  { value: "HS256", label: "HS256" },
  { value: "HS384", label: "HS384" },
  { value: "HS512", label: "HS512" },
];

/** Sign only when both a payload and a secret are present. */
export function runSign(
  payload: string,
  secret: string,
  algorithm: JwtAlgorithm,
): Promise<string> | null {
  if (payload.trim() === "" || secret === "") return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(payload);
  } catch {
    return Promise.reject(new Error("Payload is not valid JSON"));
  }
  return jwtSign(parsed, secret, algorithm);
}
