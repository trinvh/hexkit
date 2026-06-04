import { Segmented } from "../../components/ui/Segmented";
import { TransformLayout } from "../../components/ui/TransformLayout";
import type { CodeLanguage } from "../../components/ui/CodeEditor";
import { useLiveAction } from "../../lib/useLiveAction";
import { useSeed } from "../../lib/seed";
import { useToolState } from "../../lib/toolState";
import { TOML_MODES, runToml, type TomlMode } from "./run";

// TOML has no CodeMirror grammar in this build, so its pane stays plain text.
const INPUT_LANGUAGE: Record<TomlMode, CodeLanguage | undefined> = {
  to_json: undefined,
  from_json: "json",
  to_yaml: undefined,
  from_yaml: "yaml",
};

const OUTPUT_LANGUAGE: Record<TomlMode, CodeLanguage | undefined> = {
  to_json: "json",
  from_json: undefined,
  to_yaml: "yaml",
  from_yaml: undefined,
};

const PLACEHOLDER: Record<TomlMode, string> = {
  to_json: "TOML…",
  from_json: "JSON…",
  to_yaml: "TOML…",
  from_yaml: "YAML…",
};

const SAMPLE: Record<TomlMode, string> = {
  to_json:
    'name = "hexkit"\nversion = 1\nfeatures = ["json", "yaml", "base64"]\n\n[nested]\nenabled = true\ncount = 3',
  from_json: '{"name":"hexkit","version":1,"features":["json","yaml","base64"]}',
  to_yaml:
    'name = "hexkit"\nversion = 1\nfeatures = ["json", "yaml", "base64"]\n\n[nested]\nenabled = true\ncount = 3',
  from_yaml:
    "name: hexkit\nversion: 1\nfeatures:\n  - json\n  - yaml\n  - base64\nnested:\n  enabled: true\n  count: 3",
};

export function TomlTool() {
  const seed = useSeed();
  const [input, setInput] = useToolState("input", seed.value);
  const [mode, setMode] = useToolState<TomlMode>("mode", "to_json");
  const { data, error, loading } = useLiveAction(
    () => runToml(input, mode),
    [input, mode],
  );

  return (
    <TransformLayout
      toolbar={
        <Segmented
          ariaLabel="TOML conversion"
          options={TOML_MODES}
          value={mode}
          onChange={setMode}
        />
      }
      input={input}
      onInput={setInput}
      output={data ?? ""}
      error={error}
      loading={loading}
      inputLanguage={INPUT_LANGUAGE[mode]}
      outputLanguage={OUTPUT_LANGUAGE[mode]}
      inputLabel="TOML input"
      outputLabel="TOML output"
      inputPlaceholder={PLACEHOLDER[mode]}
      sample={SAMPLE[mode]}
      outputPlaceholder="Result appears here"
      errorTitle="Conversion error"
    />
  );
}
