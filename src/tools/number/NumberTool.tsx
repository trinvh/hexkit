import { useState } from "react";
import { Segmented } from "../../components/ui/Segmented";
import { TextField } from "../../components/ui/TextField";
import { InputActions } from "../../components/ui/InputActions";
import { ResultLayout } from "../../components/ui/ResultLayout";
import { useLiveAction } from "../../lib/useLiveAction";
import { NUMBER_BASES, runNumber, runCustomBase } from "./run";

export function NumberTool() {
  const [input, setInput] = useState("");
  const [base, setBase] = useState("10");
  const [customBase, setCustomBase] = useState("36");
  const { data, error } = useLiveAction(
    () => runNumber(input, base),
    [input, base],
  );
  const { data: custom } = useLiveAction(
    () => runCustomBase(input, base, customBase),
    [input, base, customBase],
  );

  const rows = data
    ? [
        { label: "Decimal", value: data.decimal },
        { label: "Hexadecimal", value: data.hexadecimal },
        { label: "Binary", value: data.binary },
        { label: "Octal", value: data.octal },
        { label: `Base ${customBase || "?"}`, value: custom ?? "" },
      ]
    : null;

  return (
    <ResultLayout
      errorTitle="Invalid number"
      emptyHint="Enter a number to convert between bases."
      header={
        <div className="flex flex-wrap items-center gap-3">
          <Segmented
            ariaLabel="Input base"
            options={NUMBER_BASES}
            value={base}
            onChange={setBase}
          />
          <div className="min-w-48 flex-1">
            <TextField
              ariaLabel="Number input"
              value={input}
              onChange={setInput}
              placeholder="Enter a number…"
              mono
            />
          </div>
          <InputActions
            onInput={setInput}
            sample="255"
            hasInput={input !== ""}
          />
          <div className="flex items-center gap-2">
            <span className="text-xs text-fg-subtle">Custom base</span>
            <div className="w-20">
              <TextField
                ariaLabel="Custom base"
                value={customBase}
                onChange={setCustomBase}
                placeholder="36"
                mono
              />
            </div>
          </div>
        </div>
      }
      rows={rows}
      error={error}
    />
  );
}
