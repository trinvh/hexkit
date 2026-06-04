import { Segmented } from "../../components/ui/Segmented";
import { TransformLayout } from "../../components/ui/TransformLayout";
import { useLiveAction } from "../../lib/useLiveAction";
import { useSeed } from "../../lib/seed";
import { useToolState } from "../../lib/toolState";
import { GZIP_MODES, runGzip, type GzipMode } from "./run";

export function GzipTool() {
  const seed = useSeed();
  const [input, setInput] = useToolState("input", seed.value);
  const [mode, setMode] = useToolState<GzipMode>("mode", "compress");
  const { data, error, loading } = useLiveAction(
    () => runGzip(input, mode),
    [input, mode],
  );

  return (
    <TransformLayout
      toolbar={
        <Segmented
          ariaLabel="Gzip mode"
          options={GZIP_MODES}
          value={mode}
          onChange={setMode}
        />
      }
      input={input}
      onInput={setInput}
      output={data ?? ""}
      error={error}
      loading={loading}
      inputLabel="Gzip input"
      outputLabel="Gzip output"
      inputPlaceholder={mode === "compress" ? "Raw text…" : "Base64 gzip…"}
      outputPlaceholder="Result appears here"
      errorTitle="Gzip error"
    />
  );
}
