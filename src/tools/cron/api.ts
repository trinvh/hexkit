import { runAction } from "../../lib/ipc";

export interface CronInfo {
  next_runs: string[];
}

export function cronParse(input: string): Promise<CronInfo> {
  return runAction<CronInfo>("cron.parse", { input });
}
