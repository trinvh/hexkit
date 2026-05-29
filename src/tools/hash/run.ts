import { hashGenerate, type Hashes } from "./api";

export function runHash(input: string): Promise<Hashes> | null {
  if (input === "") return null;
  return hashGenerate(input);
}
