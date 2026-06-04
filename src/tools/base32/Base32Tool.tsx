import { Segmented } from "../../components/ui/Segmented";
import { TransformLayout } from "../../components/ui/TransformLayout";
import { useLiveAction } from "../../lib/useLiveAction";
import { useSeed } from "../../lib/seed";
import { useToolState } from "../../lib/toolState";
import { BASE32_MODES, runBase32, type Base32Mode } from "./run";

export function Base32Tool() {
  const seed = useSeed();
  const [input, setInput] = useToolState("input", seed.value);
  const [mode, setMode] = useToolState<Base32Mode>("mode", "encode");
  const { data, error, loading } = useLiveAction(
    () => runBase32(input, mode),
    [input, mode],
  );

  return (
    <TransformLayout
      toolbar={
        <Segmented
          ariaLabel="Base32 mode"
          options={BASE32_MODES}
          value={mode}
          onChange={setMode}
        />
      }
      input={input}
      onInput={setInput}
      output={data ?? ""}
      error={error}
      loading={loading}
      inputLabel="Base32 input"
      outputLabel="Base32 output"
      inputPlaceholder={mode === "encode" ? "Raw text…" : "Base32 text…"}
      outputPlaceholder="Result appears here"
      errorTitle="Invalid Base32"
    />
  );
}
