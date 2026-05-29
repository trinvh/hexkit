import { yamlFromJson, yamlToJson } from "./api";
import type { SegmentedOption } from "../../components/ui/Segmented";

export type YamlMode = "to_json" | "from_json";

export const YAML_MODES: ReadonlyArray<SegmentedOption<YamlMode>> = [
  { value: "to_json", label: "YAML → JSON" },
  { value: "from_json", label: "JSON → YAML" },
];

export function runYaml(input: string, mode: YamlMode): Promise<string> | null {
  if (input.trim() === "") return null;
  return mode === "to_json" ? yamlToJson(input) : yamlFromJson(input);
}
