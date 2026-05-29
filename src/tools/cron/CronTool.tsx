import { useState } from "react";
import { TextField } from "../../components/ui/TextField";
import { ResultLayout } from "../../components/ui/ResultLayout";
import { useLiveAction } from "../../lib/useLiveAction";
import { useSeed } from "../../lib/seed";
import { runCron } from "./run";

export function CronTool() {
  const seed = useSeed();
  const [input, setInput] = useState(seed.value);
  const { data, error } = useLiveAction(() => runCron(input), [input]);

  const rows = data
    ? data.next_runs.map((run, index) => ({
        label: `Run ${index + 1}`,
        value: run,
      }))
    : null;

  return (
    <ResultLayout
      errorTitle="Invalid cron expression"
      emptyHint="Enter a 5-field cron expression (e.g. 0 9 * * 1-5)."
      header={
        <TextField
          ariaLabel="Cron expression"
          value={input}
          onChange={setInput}
          placeholder="*/5 * * * *"
          mono
        />
      }
      rows={rows}
      error={error}
    />
  );
}
