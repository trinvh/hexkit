import { Segmented } from "../../components/ui/Segmented";
import { TransformLayout } from "../../components/ui/TransformLayout";
import { useLiveAction } from "../../lib/useLiveAction";
import { useSeed } from "../../lib/seed";
import { useToolState } from "../../lib/toolState";
import { BASE58_MODES, runBase58, type Base58Mode } from "./run";

export function Base58Tool() {
  const seed = useSeed();
  const [input, setInput] = useToolState("input", seed.value);
  const [mode, setMode] = useToolState<Base58Mode>("mode", "encode");
  const { data, error, loading } = useLiveAction(
    () => runBase58(input, mode),
    [input, mode],
  );

  return (
    <TransformLayout
      toolbar={
        <Segmented
          ariaLabel="Base58 mode"
          options={BASE58_MODES}
          value={mode}
          onChange={setMode}
        />
      }
      input={input}
      onInput={setInput}
      output={data ?? ""}
      error={error}
      loading={loading}
      inputLabel="Base58 input"
      outputLabel="Base58 output"
      inputPlaceholder={mode === "encode" ? "Raw text…" : "Base58 text…"}
      outputPlaceholder="Result appears here"
      errorTitle="Invalid Base58"
    />
  );
}
