import { cronParse, type CronInfo } from "./api";

export function runCron(input: string): Promise<CronInfo> | null {
  if (input.trim() === "") return null;
  return cronParse(input);
}
