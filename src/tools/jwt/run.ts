import { jwtDecode, type DecodedJwt } from "./api";

export function runJwt(token: string): Promise<DecodedJwt> | null {
  if (token.trim() === "") return null;
  return jwtDecode(token);
}
