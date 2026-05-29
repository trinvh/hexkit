import { useState } from "react";
import { Segmented } from "../../components/ui/Segmented";
import { TransformLayout } from "../../components/ui/TransformLayout";
import { useLiveAction } from "../../lib/useLiveAction";
import { useSeed } from "../../lib/seed";
import {
  CSS_MODES,
  CSS_SYNTAXES,
  runCss,
  type CssMode,
  type CssSyntax,
} from "./run";

export function CssTool() {
  const seed = useSeed();
  const [input, setInput] = useState(seed.value);
  const [syntax, setSyntax] = useState<CssSyntax>("css");
  const [mode, setMode] = useState<CssMode>("beautify");
  const { data, error, loading } = useLiveAction(
    () => runCss(input, syntax, mode),
    [input, syntax, mode],
  );

  return (
    <TransformLayout
      toolbar={
        <div className="flex flex-wrap items-center gap-2">
          <Segmented
            ariaLabel="CSS syntax"
            options={CSS_SYNTAXES}
            value={syntax}
            onChange={setSyntax}
          />
          <Segmented
            ariaLabel="CSS mode"
            options={CSS_MODES}
            value={mode}
            onChange={setMode}
          />
        </div>
      }
      input={input}
      onInput={setInput}
      output={data ?? ""}
      error={error}
      loading={loading}
      language="css"
      inputLabel="CSS input"
      outputLabel="CSS output"
      inputPlaceholder="a { color: red }"
      outputPlaceholder="Result appears here"
      errorTitle="CSS error"
    />
  );
}
