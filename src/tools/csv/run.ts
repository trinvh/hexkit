import { csvFromJson, csvToJson } from "./api";
import type { SegmentedOption } from "../../components/ui/Segmented";

export type CsvMode = "to_json" | "from_json";

export const CSV_MODES: ReadonlyArray<SegmentedOption<CsvMode>> = [
  { value: "to_json", label: "CSV → JSON" },
  { value: "from_json", label: "JSON → CSV" },
];

export function runCsv(input: string, mode: CsvMode): Promise<string> | null {
  if (input.trim() === "") return null;
  return mode === "to_json" ? csvToJson(input) : csvFromJson(input);
}
