import { useState } from "react";
import { Segmented } from "../../components/ui/Segmented";
import { TransformLayout } from "../../components/ui/TransformLayout";
import { useLiveAction } from "../../lib/useLiveAction";
import { HTML_MODES, runHtml, type HtmlMode } from "./run";

export function HtmlTool() {
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<HtmlMode>("encode");
  const { data, error, loading } = useLiveAction(
    () => runHtml(input, mode),
    [input, mode],
  );

  return (
    <TransformLayout
      toolbar={
        <Segmented
          ariaLabel="HTML entity mode"
          options={HTML_MODES}
          value={mode}
          onChange={setMode}
        />
      }
      input={input}
      onInput={setInput}
      output={data ?? ""}
      error={error}
      loading={loading}
      inputLabel="HTML input"
      outputLabel="HTML output"
      inputPlaceholder={
        mode === "encode"
          ? "Text to escape…"
          : "Text with &entities; to decode…"
      }
      outputPlaceholder="Result appears here"
      errorTitle="Error"
    />
  );
}
