import { runAction } from "../../lib/ipc";

export interface TimeInfo {
  epoch_seconds: string;
  epoch_millis: string;
  iso8601: string;
  utc: string;
  local: string;
  day_of_week: string;
}

export function timeConvert(input: string): Promise<TimeInfo> {
  return runAction<TimeInfo>("time.convert", { input });
}
