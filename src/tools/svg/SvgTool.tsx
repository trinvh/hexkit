import { useState } from "react";
import { TransformLayout } from "../../components/ui/TransformLayout";
import { useLiveAction } from "../../lib/useLiveAction";
import { useSeed } from "../../lib/seed";
import { runSvg } from "./run";

export function SvgTool() {
  const seed = useSeed();
  const [input, setInput] = useState(seed.value);
  const { data, error, loading } = useLiveAction(() => runSvg(input), [input]);

  return (
    <TransformLayout
      toolbar={
        <span className="text-xs font-medium uppercase tracking-wider text-fg-subtle">
          SVG → CSS
        </span>
      }
      input={input}
      onInput={setInput}
      output={data ?? ""}
      error={error}
      loading={loading}
      inputLanguage="xml"
      outputLanguage="css"
      inputLabel="SVG input"
      outputLabel="CSS output"
      inputPlaceholder="<svg>…</svg>"
      outputPlaceholder="CSS background-image appears here"
      errorTitle="Error"
    />
  );
}
