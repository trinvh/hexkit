import { TransformLayout } from "../../components/ui/TransformLayout";
import { useLiveAction } from "../../lib/useLiveAction";
import { useSeed } from "../../lib/seed";
import { useToolState } from "../../lib/toolState";
import { runJsx } from "./run";

export function JsxTool() {
  const seed = useSeed();
  const [input, setInput] = useToolState("input", seed.value);
  const { data, error, loading } = useLiveAction(() => runJsx(input), [input]);

  return (
    <TransformLayout
      toolbar={
        <span className="text-xs font-medium uppercase tracking-wider text-fg-subtle">
          HTML → JSX
        </span>
      }
      input={input}
      onInput={setInput}
      output={data ?? ""}
      error={error}
      loading={loading}
      inputLanguage="html"
      outputLanguage="javascript"
      inputLabel="HTML input"
      outputLabel="JSX output"
      inputPlaceholder='<label class="x" for="y">'
      sample='<div class="card"><label for="email">Email</label><input id="email" tabindex="0" /></div>'
      outputPlaceholder="JSX appears here"
      errorTitle="Error"
    />
  );
}
