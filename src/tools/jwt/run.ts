import { jwtDecode, jwtVerify, type DecodedJwt, type Verification } from "./api";

export function runJwt(token: string): Promise<DecodedJwt> | null {
  if (token.trim() === "") return null;
  return jwtDecode(token);
}

/** Verify only when both a token and a secret are present. */
export function runVerify(
  token: string,
  secret: string,
): Promise<Verification> | null {
  if (token.trim() === "" || secret === "") return null;
  return jwtVerify(token, secret);
}
