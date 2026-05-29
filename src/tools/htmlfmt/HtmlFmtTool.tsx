import { useState } from "react";
import { Segmented } from "../../components/ui/Segmented";
import { TransformLayout } from "../../components/ui/TransformLayout";
import { useLiveAction } from "../../lib/useLiveAction";
import { useSeed } from "../../lib/seed";
import { HTML_FMT_MODES, runHtmlFmt, type HtmlFmtMode } from "./run";

export function HtmlFmtTool() {
  const seed = useSeed();
  const [input, setInput] = useState(seed.value);
  const [mode, setMode] = useState<HtmlFmtMode>("beautify");
  const { data, error, loading } = useLiveAction(
    () => runHtmlFmt(input, mode),
    [input, mode],
  );

  return (
    <TransformLayout
      toolbar={
        <Segmented
          ariaLabel="HTML mode"
          options={HTML_FMT_MODES}
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
      inputPlaceholder="<div><p>hi</p></div>"
      outputPlaceholder="Result appears here"
      errorTitle="HTML error"
    />
  );
}
