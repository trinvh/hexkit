import { useState } from "react";
import { Segmented } from "../../components/ui/Segmented";
import { TextField } from "../../components/ui/TextField";
import { InputActions } from "../../components/ui/InputActions";
import { ResultLayout } from "../../components/ui/ResultLayout";
import { useLiveAction } from "../../lib/useLiveAction";
import { useSeed } from "../../lib/seed";
import { runTime, TIME_UNITS } from "./run";

export function TimeTool() {
  const seed = useSeed();
  const [input, setInput] = useState(seed.value);
  const [unit, setUnit] = useState("auto");
  const { data, error } = useLiveAction(
    () => runTime(input, unit),
    [input, unit],
  );

  const rows = data
    ? [
        { label: "Relative", value: data.relative },
        { label: "Epoch (s)", value: data.epoch_seconds },
        { label: "Epoch (ms)", value: data.epoch_millis },
        { label: "ISO 8601", value: data.iso8601 },
        { label: "RFC 2822", value: data.rfc2822 },
        { label: "UTC", value: data.utc },
        { label: "Local", value: data.local },
        { label: "Day", value: data.day_of_week },
        { label: "Day of year", value: data.day_of_year },
        { label: "Week of year", value: data.week_of_year },
        { label: "Leap year", value: data.is_leap_year ? "Yes" : "No" },
      ]
    : null;

  return (
    <ResultLayout
      errorTitle="Invalid timestamp"
      emptyHint="Enter a Unix timestamp or date, or use Now."
      header={
        <div className="flex flex-wrap items-center gap-3">
          <Segmented
            ariaLabel="Input unit"
            options={TIME_UNITS}
            value={unit}
            onChange={setUnit}
          />
          <div className="min-w-48 flex-1">
            <TextField
              ariaLabel="Timestamp or date"
              value={input}
              onChange={setInput}
              placeholder="e.g. 1700000000 or 2023-11-14T22:13:20Z"
              mono
            />
          </div>
          <button
            type="button"
            onClick={() => setInput(String(Math.floor(Date.now() / 1000)))}
            className="shrink-0 rounded-lg border border-border px-3 py-2 text-xs text-fg-muted transition-colors hover:border-border-strong hover:text-fg"
          >
            Now
          </button>
          <InputActions
            onInput={setInput}
            sample="1700000000"
            hasInput={input !== ""}
          />
        </div>
      }
      rows={rows}
      error={error}
    />
  );
}
