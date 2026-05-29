import { runAction } from "../../lib/ipc";

export interface DecodedJwt {
  header: string;
  payload: string;
  signature: string;
}

export function jwtDecode(token: string): Promise<DecodedJwt> {
  return runAction<DecodedJwt>("jwt.decode", { token });
}

export interface Verification {
  valid: boolean;
  algorithm: string;
  reason: string | null;
}

export function jwtVerify(token: string, secret: string): Promise<Verification> {
  return runAction<Verification>("jwt.verify", { token, secret });
}
