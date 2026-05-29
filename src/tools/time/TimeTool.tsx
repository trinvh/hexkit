import { useState } from "react";
import { TextField } from "../../components/ui/TextField";
import { ResultLayout } from "../../components/ui/ResultLayout";
import { useLiveAction } from "../../lib/useLiveAction";
import { useSeed } from "../../lib/seed";
import { runTime } from "./run";

export function TimeTool() {
  const seed = useSeed();
  const [input, setInput] = useState(seed.value);
  const { data, error } = useLiveAction(() => runTime(input), [input]);

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
        <div className="flex items-center gap-3">
          <div className="flex-1">
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
        </div>
      }
      rows={rows}
      error={error}
    />
  );
}
