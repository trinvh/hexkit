import { Segmented } from "../../components/ui/Segmented";
import { TransformLayout } from "../../components/ui/TransformLayout";
import { useLiveAction } from "../../lib/useLiveAction";
import { useToolState } from "../../lib/toolState";
import { HTML_MODES, runHtml, type HtmlMode } from "./run";

export function HtmlTool() {
  const [input, setInput] = useToolState("input", "");
  const [mode, setMode] = useToolState<HtmlMode>("mode", "encode");
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
      sample={
        mode === "encode"
          ? '<a href="?x=1&y=2">Tom & Jerry "quote"</a>'
          : "&lt;a href=&quot;?x=1&amp;y=2&quot;&gt;Tom &amp; Jerry&lt;/a&gt;"
      }
      outputPlaceholder="Result appears here"
      errorTitle="Error"
    />
  );
}
