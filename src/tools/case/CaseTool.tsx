import { TextField } from "../../components/ui/TextField";
import { ResultLayout } from "../../components/ui/ResultLayout";
import { useLiveAction } from "../../lib/useLiveAction";
import { useToolState } from "../../lib/toolState";
import { CASE_ROWS, runCase } from "./run";

export function CaseTool() {
  const [input, setInput] = useToolState("input", "");
  const { data, error } = useLiveAction(() => runCase(input), [input]);

  const rows = data
    ? CASE_ROWS.map((row) => ({ label: row.label, value: data[row.key] }))
    : null;

  return (
    <ResultLayout
      emptyHint="Type text to see every case style."
      header={
        <TextField
          ariaLabel="Text to convert"
          value={input}
          onChange={setInput}
          placeholder="Enter text…"
        />
      }
      rows={rows}
      error={error}
    />
  );
}
