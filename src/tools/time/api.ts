import { runAction } from "../../lib/ipc";

export interface TimeInfo {
  epoch_seconds: string;
  epoch_millis: string;
  iso8601: string;
  utc: string;
  local: string;
  day_of_week: string;
  relative: string;
  day_of_year: string;
  week_of_year: string;
  is_leap_year: boolean;
  rfc2822: string;
}

export function timeConvert(input: string, unit = "auto"): Promise<TimeInfo> {
  return runAction<TimeInfo>("time.convert", { input, unit });
}
