import { useState } from "react";
import { Segmented } from "../../components/ui/Segmented";
import { TextField } from "../../components/ui/TextField";
import { ResultLayout } from "../../components/ui/ResultLayout";
import { useLiveAction } from "../../lib/useLiveAction";
import { NUMBER_BASES, runNumber } from "./run";

export function NumberTool() {
  const [input, setInput] = useState("");
  const [base, setBase] = useState("10");
  const { data, error } = useLiveAction(
    () => runNumber(input, base),
    [input, base],
  );

  const rows = data
    ? [
        { label: "Decimal", value: data.decimal },
        { label: "Hexadecimal", value: data.hexadecimal },
        { label: "Binary", value: data.binary },
        { label: "Octal", value: data.octal },
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
        </div>
      }
      rows={rows}
      error={error}
    />
  );
}
