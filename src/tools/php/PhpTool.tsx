import { useState } from "react";
import { Segmented } from "../../components/ui/Segmented";
import { TransformLayout } from "../../components/ui/TransformLayout";
import { useLiveAction } from "../../lib/useLiveAction";
import { useSeed } from "../../lib/seed";
import { PHP_MODES, runPhp, type PhpMode } from "./run";

export function PhpTool() {
  const seed = useSeed();
  const [input, setInput] = useState(seed.value);
  const [mode, setMode] = useState<PhpMode>("to_json");
  const { data, error, loading } = useLiveAction(
    () => runPhp(input, mode),
    [input, mode],
  );

  return (
    <TransformLayout
      toolbar={
        <Segmented
          ariaLabel="PHP conversion"
          options={PHP_MODES}
          value={mode}
          onChange={setMode}
        />
      }
      input={input}
      onInput={setInput}
      output={data ?? ""}
      error={error}
      loading={loading}
      language={mode === "to_json" ? "json" : undefined}
      inputLabel="PHP input"
      outputLabel="PHP output"
      inputPlaceholder={mode === "to_json" ? 'a:1:{s:1:"a";i:1;}' : '{"a":1}'}
      outputPlaceholder="Result appears here"
      errorTitle="Conversion error"
    />
  );
}
