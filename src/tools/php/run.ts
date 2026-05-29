import { phpFromJson, phpToJson } from "./api";
import type { SegmentedOption } from "../../components/ui/Segmented";

export type PhpMode = "to_json" | "from_json";

export const PHP_MODES: ReadonlyArray<SegmentedOption<PhpMode>> = [
  { value: "to_json", label: "PHP → JSON" },
  { value: "from_json", label: "JSON → PHP" },
];

export function runPhp(input: string, mode: PhpMode): Promise<string> | null {
  if (input.trim() === "") return null;
  return mode === "to_json" ? phpToJson(input) : phpFromJson(input);
}
