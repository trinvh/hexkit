import { timeConvert, type TimeInfo } from "./api";

export function runTime(input: string): Promise<TimeInfo> | null {
  if (input.trim() === "") return null;
  return timeConvert(input);
}
