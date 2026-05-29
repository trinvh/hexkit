import { useState } from "react";
import { Segmented } from "../../components/ui/Segmented";
import { TransformLayout } from "../../components/ui/TransformLayout";
import { useLiveAction } from "../../lib/useLiveAction";
import { URL_MODES, runUrl, type UrlMode } from "./run";

export function UrlTool() {
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<UrlMode>("encode");
  const { data, error, loading } = useLiveAction(
    () => runUrl(input, mode),
    [input, mode],
  );

  return (
    <TransformLayout
      toolbar={
        <Segmented
          ariaLabel="URL mode"
          options={URL_MODES}
          value={mode}
          onChange={setMode}
        />
      }
      input={input}
      onInput={setInput}
      output={data ?? ""}
      error={error}
      loading={loading}
      inputLabel="URL input"
      outputLabel="URL output"
      inputPlaceholder={
        mode === "encode" ? "Text to URL-encode…" : "Encoded text to decode…"
      }
      outputPlaceholder="Result appears here"
      errorTitle="Invalid input"
    />
  );
}
