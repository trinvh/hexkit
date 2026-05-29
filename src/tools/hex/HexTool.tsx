import { useState } from "react";
import { Segmented } from "../../components/ui/Segmented";
import { TransformLayout } from "../../components/ui/TransformLayout";
import { useLiveAction } from "../../lib/useLiveAction";
import { useSeed } from "../../lib/seed";
import { HEX_MODES, runHex, type HexMode } from "./run";

export function HexTool() {
  const seed = useSeed();
  const [input, setInput] = useState(seed.value);
  const [mode, setMode] = useState<HexMode>("encode");
  const { data, error, loading } = useLiveAction(
    () => runHex(input, mode),
    [input, mode],
  );

  return (
    <TransformLayout
      toolbar={
        <Segmented
          ariaLabel="Hex mode"
          options={HEX_MODES}
          value={mode}
          onChange={setMode}
        />
      }
      input={input}
      onInput={setInput}
      output={data ?? ""}
      error={error}
      loading={loading}
      inputLabel="Hex input"
      outputLabel="Hex output"
      inputPlaceholder={mode === "encode" ? "Text…" : "Hex bytes…"}
      outputPlaceholder="Result appears here"
      errorTitle="Invalid hex"
    />
  );
}
