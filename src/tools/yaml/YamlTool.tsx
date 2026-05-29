import { useState } from "react";
import { Segmented } from "../../components/ui/Segmented";
import { TransformLayout } from "../../components/ui/TransformLayout";
import { useLiveAction } from "../../lib/useLiveAction";
import { useSeed } from "../../lib/seed";
import { YAML_MODES, runYaml, type YamlMode } from "./run";

export function YamlTool() {
  const seed = useSeed();
  const [input, setInput] = useState(seed.value);
  const [mode, setMode] = useState<YamlMode>("to_json");
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
      outputPlaceholder="Result appears here"
      errorTitle="Conversion error"
    />
  );
}
