import { runAction } from "../../lib/ipc";

export interface DecodedJwt {
  header: string;
  payload: string;
  signature: string;
}

export function jwtDecode(token: string): Promise<DecodedJwt> {
  return runAction<DecodedJwt>("jwt.decode", { token });
}
