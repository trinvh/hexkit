import { useState } from "react";
import { Segmented } from "../../components/ui/Segmented";
import { TransformLayout } from "../../components/ui/TransformLayout";
import { useLiveAction } from "../../lib/useLiveAction";
import { JSON_MODES, runJson, type JsonMode } from "./run";

export function JsonTool() {
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<JsonMode>("  ");
  const { data, error, loading } = useLiveAction(
    () => runJson(input, mode),
    [input, mode],
  );

  return (
    <TransformLayout
      toolbar={
        <Segmented
          ariaLabel="JSON output mode"
          options={JSON_MODES}
          value={mode}
          onChange={setMode}
        />
      }
      input={input}
      onInput={setInput}
      output={data ?? ""}
      error={error}
      loading={loading}
      language="json"
      inputLabel="JSON input"
      outputLabel="JSON output"
      inputPlaceholder={'Paste JSON here…\n\ne.g. {"hello":"world"}'}
      outputPlaceholder="Formatted output appears here"
      errorTitle="Invalid JSON"
    />
  );
}
