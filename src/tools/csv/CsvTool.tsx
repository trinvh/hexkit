import { useState } from "react";
import { Segmented } from "../../components/ui/Segmented";
import { TransformLayout } from "../../components/ui/TransformLayout";
import { useLiveAction } from "../../lib/useLiveAction";
import { useSeed } from "../../lib/seed";
import { CSV_MODES, runCsv, type CsvMode } from "./run";

export function CsvTool() {
  const seed = useSeed();
  const [input, setInput] = useState(seed.value);
  const [mode, setMode] = useState<CsvMode>("to_json");
  const { data, error, loading } = useLiveAction(
    () => runCsv(input, mode),
    [input, mode],
  );

  return (
    <TransformLayout
      toolbar={
        <Segmented
          ariaLabel="CSV conversion"
          options={CSV_MODES}
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
      inputLabel="CSV input"
      outputLabel="CSV output"
      inputPlaceholder={mode === "to_json" ? "a,b\n1,2" : '[{"a":1,"b":2}]'}
      outputPlaceholder="Result appears here"
      errorTitle="Conversion error"
    />
  );
}
