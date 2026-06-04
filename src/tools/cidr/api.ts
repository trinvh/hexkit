import { runAction } from "../../lib/ipc";

export interface CidrInfo {
  version: 4 | 6;
  network: string;
  prefixLen: number;
  netmask: string;
  hostMask: string;
  broadcast: string;
  firstHost: string;
  lastHost: string;
  usableHosts: string;
  totalAddresses: string;
}

export function cidrParse(input: string): Promise<CidrInfo> {
  return runAction<CidrInfo>("cidr.parse", { input });
}
