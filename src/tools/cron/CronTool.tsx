import { TextField } from "../../components/ui/TextField";
import { InputActions } from "../../components/ui/InputActions";
import { ResultList } from "../../components/ui/ResultList";
import { useLiveAction } from "../../lib/useLiveAction";
import { useSeed } from "../../lib/seed";
import { useToolState } from "../../lib/toolState";
import { runCron } from "./run";

const EXAMPLES: ReadonlyArray<{ expr: string; label: string }> = [
  { expr: "*/5 * * * *", label: "Every 5 minutes" },
  { expr: "0 * * * *", label: "Hourly" },
  { expr: "0 9 * * 1-5", label: "Weekdays at 09:00" },
  { expr: "0 0 * * *", label: "Daily at midnight" },
  { expr: "0 0 * * 0", label: "Weekly (Sunday)" },
  { expr: "0 0 1 * *", label: "Monthly (1st)" },
  { expr: "0 0 1 1 *", label: "Yearly (Jan 1)" },
];

function formatLocal(rfc: string): string {
  const d = new Date(rfc);
  if (Number.isNaN(d.getTime())) return rfc;
  const date = d.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const time = d.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return `${date} at ${time}`;
}

export function CronTool() {
  const seed = useSeed();
  const [input, setInput] = useToolState("input", seed.value);
  const { data, error } = useLiveAction(() => runCron(input), [input]);

  const fieldRows = data
    ? [
        { label: "Minutes", value: data.minutes },
        { label: "Hours", value: data.hours },
        { label: "Day of Month", value: data.day_of_month },
        { label: "Months", value: data.months },
        { label: "Day of Week", value: data.day_of_week },
      ]
    : [];
  const runRows = data
    ? data.next_runs.map((run, i) => ({
        label: i === 0 ? "Next executions" : "",
        value: formatLocal(run),
      }))
    : [];

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-wrap items-center gap-3 border-b border-border p-4">
        <div className="min-w-56 flex-1">
          <TextField
            ariaLabel="Cron expression"
            value={input}
            onChange={setInput}
            placeholder="*/5 * * * *"
            mono
          />
        </div>
        <select
          aria-label="Pick an example"
          value=""
          onChange={(e) => e.target.value && setInput(e.target.value)}
          className="h-10 rounded-lg border border-border bg-surface px-2 text-sm text-fg-muted outline-none focus:border-border-strong"
        >
          <option value="">Pick an example…</option>
          {EXAMPLES.map((ex) => (
            <option key={ex.expr} value={ex.expr}>
              {ex.label} ({ex.expr})
            </option>
          ))}
        </select>
        <InputActions
          onInput={setInput}
          sample="*/5 * * * *"
          hasInput={input !== ""}
        />
      </div>

      <div className="min-h-0 flex-1 overflow-auto p-4">
        {error ? (
          <div className="rounded-lg border border-border-strong bg-surface px-4 py-3 text-sm">
            <span className="font-medium text-accent">
              Invalid cron expression
            </span>
            <span className="ml-2 text-fg-muted">{error}</span>
          </div>
        ) : data ? (
          <div className="space-y-4">
            <p className="text-base font-medium text-fg">{data.description}</p>
            <div className="overflow-hidden rounded-xl border border-border bg-surface">
              <ResultList rows={fieldRows} />
            </div>
            <div className="overflow-hidden rounded-xl border border-border bg-surface">
              <ResultList rows={runRows} />
            </div>
          </div>
        ) : (
          <p className="px-1 text-sm text-fg-subtle">
            Enter a 5-field cron expression (e.g. 0 9 * * 1-5).
          </p>
        )}
      </div>
    </div>
  );
}
