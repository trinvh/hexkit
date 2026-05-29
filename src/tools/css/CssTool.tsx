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
      sample=".card{display:flex;gap:1rem;padding:16px;color:#222;background:#fff}.card:hover{box-shadow:0 2px 8px rgba(0,0,0,.15)}@media(max-width:600px){.card{flex-direction:column}}"
      outputPlaceholder="Result appears here"
      errorTitle="CSS error"
    />
  );
}
