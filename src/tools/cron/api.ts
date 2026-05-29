import { runAction } from "../../lib/ipc";

export interface CronInfo {
  description: string;
  minutes: string;
  hours: string;
  day_of_month: string;
  months: string;
  day_of_week: string;
  next_runs: string[];
}

export function cronParse(input: string): Promise<CronInfo> {
  return runAction<CronInfo>("cron.parse", { input });
}
