import { timeConvert, type TimeInfo } from "./api";
import type { SegmentedOption } from "../../components/ui/Segmented";

export const TIME_UNITS: ReadonlyArray<SegmentedOption<string>> = [
  { value: "auto", label: "Auto" },
  { value: "s", label: "s" },
  { value: "ms", label: "ms" },
  { value: "us", label: "µs" },
  { value: "ns", label: "ns" },
];

export function runTime(
  input: string,
  unit = "auto",
): Promise<TimeInfo> | null {
  if (input.trim() === "") return null;
  return timeConvert(input, unit);
}
