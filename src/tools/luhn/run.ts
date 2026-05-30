import { luhnCheck, type LuhnReport } from "./api";

export function runLuhn(input: string): Promise<LuhnReport> | null {
  if (input.trim() === "") return null;
  return luhnCheck(input);
}
