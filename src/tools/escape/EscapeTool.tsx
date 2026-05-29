import { useState } from "react";
import { Segmented } from "../../components/ui/Segmented";
import { TransformLayout } from "../../components/ui/TransformLayout";
import { useLiveAction } from "../../lib/useLiveAction";
import { useSeed } from "../../lib/seed";
import { ESCAPE_MODES, runEscape, type EscapeMode } from "./run";

export function EscapeTool() {
  const seed = useSeed();
  const [input, setInput] = useState(seed.value);
  const [mode, setMode] = useState<EscapeMode>("escape");
  const { data, error, loading } = useLiveAction(
    () => runEscape(input, mode),
    [input, mode],
  );

  return (
    <TransformLayout
      toolbar={
        <Segmented
          ariaLabel="Escape mode"
          options={ESCAPE_MODES}
          value={mode}
          onChange={setMode}
        />
      }
      input={input}
      onInput={setInput}
      output={data ?? ""}
      error={error}
      loading={loading}
      inputLabel="Escape input"
      outputLabel="Escape output"
      inputPlaceholder={mode === "escape" ? "Raw text…" : "Escaped text…"}
      outputPlaceholder="Result appears here"
      errorTitle="Invalid escape sequence"
    />
  );
}
