import { runAction } from "../../lib/ipc";

export interface CertInfo {
  subject: string;
  issuer: string;
  serial: string;
  not_before: string;
  not_after: string;
  signature_algorithm: string;
  version: string;
}

export function x509Decode(input: string): Promise<CertInfo> {
  return runAction<CertInfo>("x509.decode", { input });
}
