import { cidrParse, type CidrInfo } from "./api";

export function runCidr(input: string): Promise<CidrInfo> | null {
  if (input.trim() === "") return null;
  return cidrParse(input);
}
