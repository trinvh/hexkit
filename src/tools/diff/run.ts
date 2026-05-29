import { diffCompare, type DiffFormat, type DiffLine } from "./api";
import type { SegmentedOption } from "../../components/ui/Segmented";

export const DIFF_FORMATS: ReadonlyArray<SegmentedOption<DiffFormat>> = [
  { value: "text", label: "Text" },
  { value: "json", label: "JSON" },
  { value: "xml", label: "XML" },
];

export function runDiff(
  oldText: string,
  newText: string,
  format: DiffFormat = "text",
  sort = false,
): Promise<DiffLine[]> | null {
  if (oldText === "" && newText === "") return null;
  return diffCompare(oldText, newText, format, sort);
}
