import { processLines, type LinesOptions } from "./api";
import type { SegmentedOption } from "../../components/ui/Segmented";

export type SortMode = "none" | "asc" | "desc";

export const SORT_MODES: ReadonlyArray<SegmentedOption<SortMode>> = [
  { value: "none", label: "Original" },
  { value: "asc", label: "A → Z" },
  { value: "desc", label: "Z → A" },
];

export function runLines(
  input: string,
  options: LinesOptions,
): Promise<string> | null {
  if (input === "") return null;
  return processLines(input, options);
}
