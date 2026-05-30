import { TextField } from "../../components/ui/TextField";
import { InputActions } from "../../components/ui/InputActions";
import { ResultLayout } from "../../components/ui/ResultLayout";
import { useLiveAction } from "../../lib/useLiveAction";
import { useToolState } from "../../lib/toolState";
import { runLuhn } from "./run";

export function LuhnTool() {
  const [input, setInput] = useToolState("input", "");
  const { data, error } = useLiveAction(() => runLuhn(input), [input]);

  const rows = data
    ? [
        { label: "Status", value: data.valid ? "Valid" : "Invalid" },
        { label: "Digits", value: data.digits },
        { label: "Expected check", value: String(data.expectedCheckDigit) },
        { label: "Provided check", value: String(data.providedCheckDigit) },
        {
          label: data.valid ? "Number" : "Corrected",
          value: data.corrected,
        },
        { label: "Checksum mod 10", value: String(data.checksumMod10) },
      ]
    : null;

  return (
    <ResultLayout
      emptyHint="Paste a credit card, IMEI or other Luhn-checked number."
      header={
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="flex-1">
            <TextField
              ariaLabel="Number to check"
              value={input}
              onChange={setInput}
              placeholder="e.g. 4111 1111 1111 1111"
              mono
            />
          </div>
          <InputActions
            onInput={setInput}
            sample="4111 1111 1111 1111"
            hasInput={input !== ""}
          />
        </div>
      }
      rows={rows}
      error={error}
    />
  );
}
