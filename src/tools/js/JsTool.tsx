import { useState } from "react";
import { TransformLayout } from "../../components/ui/TransformLayout";
import { useLiveAction } from "../../lib/useLiveAction";
import { useSeed } from "../../lib/seed";
import { runJs } from "./run";

export function JsTool() {
  const seed = useSeed();
  const [input, setInput] = useState(seed.value);
  const { data, error, loading } = useLiveAction(() => runJs(input), [input]);

  return (
    <TransformLayout
      toolbar={
        <span className="text-xs font-medium uppercase tracking-wider text-fg-subtle">
          JS Minify
        </span>
      }
      input={input}
      onInput={setInput}
      output={data ?? ""}
      error={error}
      loading={loading}
      language="javascript"
      inputLabel="JavaScript input"
      outputLabel="Minified output"
      inputPlaceholder="const x = 1 + 2;"
      sample={"function greet(name) {\n  const msg = `Hello, ${name}!`;\n  console.log(msg);\n  return msg;\n}\n\ngreet('Hexkit');"}
      outputPlaceholder="Minified JS appears here"
      errorTitle="JavaScript error"
    />
  );
}
