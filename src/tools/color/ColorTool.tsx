import { useState } from "react";
import { TextField } from "../../components/ui/TextField";
import { InputActions } from "../../components/ui/InputActions";
import { ResultLayout } from "../../components/ui/ResultLayout";
import { useLiveAction } from "../../lib/useLiveAction";
import { useSeed } from "../../lib/seed";
import { runColor } from "./run";

export function ColorTool() {
  const seed = useSeed();
  const [input, setInput] = useState(seed.value);
  const { data, error } = useLiveAction(() => runColor(input), [input]);

  const rows = data
    ? [
        { label: "HEX", value: data.hex },
        { label: "RGB", value: data.rgb },
        { label: "HSL", value: data.hsl },
      ]
    : null;

  return (
    <ResultLayout
      errorTitle="Invalid color"
      emptyHint="Enter a color (hex, rgb(), hsl(), or a name)."
      header={
        <div className="flex items-center gap-3">
          <div
            className="size-10 shrink-0 rounded-lg border border-border"
            style={{ backgroundColor: data?.hex ?? "transparent" }}
            aria-hidden
          />
          <div className="flex-1">
            <TextField
              ariaLabel="Color value"
              value={input}
              onChange={setInput}
              placeholder="#3b82f6, rgb(59 130 246), or teal"
              mono
            />
          </div>
          <InputActions
            onInput={setInput}
            sample="#3b82f6"
            hasInput={input !== ""}
          />
        </div>
      }
      rows={rows}
      error={error}
    />
  );
}
