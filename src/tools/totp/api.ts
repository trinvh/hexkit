import { runAction } from "../../lib/ipc";

export type TotpAlgorithm = "SHA1" | "SHA256" | "SHA512";

export interface TotpCode {
  code: string;
  secondsRemaining: number;
}

export interface TotpOptions {
  algorithm: TotpAlgorithm;
  digits: number;
  period: number;
}

export function totpGenerate(
  secret: string,
  options: TotpOptions,
  timestamp: number,
): Promise<TotpCode> {
  return runAction<TotpCode>("totp.generate", {
    secret,
    algorithm: options.algorithm,
    digits: options.digits,
    period: options.period,
    timestamp,
  });
}

export function totpUri(
  secret: string,
  issuer: string,
  account: string,
  options: TotpOptions,
): Promise<string> {
  return runAction<string>("totp.uri", {
    secret,
    issuer,
    account,
    algorithm: options.algorithm,
    digits: options.digits,
    period: options.period,
  });
}

export function qrGenerate(input: string): Promise<string> {
  return runAction<string>("qr.generate", { input });
}
