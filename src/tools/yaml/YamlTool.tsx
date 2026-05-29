import { Segmented } from "../../components/ui/Segmented";
import { TransformLayout } from "../../components/ui/TransformLayout";
import { useLiveAction } from "../../lib/useLiveAction";
import { useSeed } from "../../lib/seed";
import { useToolState } from "../../lib/toolState";
import { YAML_MODES, runYaml, type YamlMode } from "./run";

export function YamlTool() {
  const seed = useSeed();
  const [input, setInput] = useToolState("input", seed.value);
  const [mode, setMode] = useToolState<YamlMode>("mode", "to_json");
  const { data, error, loading } = useLiveAction(
    () => runYaml(input, mode),
    [input, mode],
  );

  return (
    <TransformLayout
      toolbar={
        <Segmented
          ariaLabel="YAML conversion"
          options={YAML_MODES}
          value={mode}
          onChange={setMode}
        />
      }
      input={input}
      onInput={setInput}
      output={data ?? ""}
      error={error}
      loading={loading}
      inputLanguage={mode === "to_json" ? "yaml" : "json"}
      outputLanguage={mode === "to_json" ? "json" : "yaml"}
      inputLabel="YAML input"
      outputLabel="YAML output"
      inputPlaceholder={mode === "to_json" ? "YAML…" : "JSON…"}
      sample={
        mode === "to_json"
          ? "name: hexkit\nversion: 1\nfeatures:\n  - json\n  - yaml\n  - base64\nnested:\n  enabled: true\n  count: 3"
          : '{"name":"hexkit","version":1,"features":["json","yaml","base64"]}'
      }
      outputPlaceholder="Result appears here"
      errorTitle="Conversion error"
    />
  );
}
