import { Segmented } from "../../components/ui/Segmented";
import { TransformLayout } from "../../components/ui/TransformLayout";
import { useLiveAction } from "../../lib/useLiveAction";
import { useSeed } from "../../lib/seed";
import { useToolState } from "../../lib/toolState";
import { BASE64_MODES, runBase64, type Base64Mode } from "./run";

export function Base64Tool() {
  const seed = useSeed();
  const [input, setInput] = useToolState("input", seed.value);
  const [mode, setMode] = useToolState<Base64Mode>(
    "mode",
    seed.mode === "decode" ? "decode" : "encode",
  );
  const { data, error, loading } = useLiveAction(
    () => runBase64(input, mode),
    [input, mode],
  );

  return (
    <TransformLayout
      toolbar={
        <Segmented
          ariaLabel="Base64 mode"
          options={BASE64_MODES}
          value={mode}
          onChange={setMode}
        />
      }
      input={input}
      onInput={setInput}
      output={data ?? ""}
      error={error}
      loading={loading}
      inputLabel="Base64 input"
      outputLabel="Base64 output"
      inputPlaceholder={
        mode === "encode" ? "Text to encode…" : "Base64 to decode…"
      }
      outputPlaceholder="Result appears here"
      errorTitle="Invalid Base64"
    />
  );
}
