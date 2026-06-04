import { chmodDescribe, type ChmodMode } from "./api";

export function runChmod(input: string): Promise<ChmodMode> | null {
  if (input.trim() === "") return null;
  return chmodDescribe(input);
}
