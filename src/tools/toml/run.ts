import { tomlFromJson, tomlFromYaml, tomlToJson, tomlToYaml } from "./api";
import type { SegmentedOption } from "../../components/ui/Segmented";

export type TomlMode = "to_json" | "from_json" | "to_yaml" | "from_yaml";

export const TOML_MODES: ReadonlyArray<SegmentedOption<TomlMode>> = [
  { value: "to_json", label: "TOML → JSON" },
  { value: "from_json", label: "JSON → TOML" },
  { value: "to_yaml", label: "TOML → YAML" },
  { value: "from_yaml", label: "YAML → TOML" },
];

export function runToml(input: string, mode: TomlMode): Promise<string> | null {
  if (input.trim() === "") return null;
  switch (mode) {
    case "to_json":
      return tomlToJson(input);
    case "from_json":
      return tomlFromJson(input);
    case "to_yaml":
      return tomlToYaml(input);
    case "from_yaml":
      return tomlFromYaml(input);
  }
}
