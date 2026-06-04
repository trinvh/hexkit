import { runAction } from "../../lib/ipc";

export type JwtAlgorithm = "HS256" | "HS384" | "HS512";

export function jwtSign(
  payload: unknown,
  secret: string,
  algorithm: JwtAlgorithm,
): Promise<string> {
  return runAction<string>("jwt.sign", { payload, secret, algorithm });
}
