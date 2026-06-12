import { timeConvert, type TimeInfo } from "./api";
import type { SegmentedOption } from "../../components/ui/Segmented";

export const TIME_UNITS: ReadonlyArray<SegmentedOption<string>> = [
  { value: "auto", label: "Auto" },
  { value: "s", label: "s" },
  { value: "ms", label: "ms" },
  { value: "us", label: "µs" },
  { value: "ns", label: "ns" },
];

export function runTime(
  input: string,
  unit = "auto",
  timezone = "",
): Promise<TimeInfo> | null {
  if (input.trim() === "") return null;
  return timeConvert(input, unit, timezone);
}

/** Used only when the runtime doesn't expose the full IANA list. */
const FALLBACK_TIMEZONES = [
  "UTC",
  "America/Los_Angeles",
  "America/Denver",
  "America/Chicago",
  "America/New_York",
  "America/Sao_Paulo",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Europe/Moscow",
  "Asia/Dubai",
  "Asia/Kolkata",
  "Asia/Shanghai",
  "Asia/Tokyo",
  "Asia/Singapore",
  "Australia/Sydney",
  "Pacific/Auckland",
];

/** The user's local IANA timezone, defaulting to UTC when undetectable. */
export function detectLocalTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

/**
 * Selectable IANA timezones — the runtime's full list when available
 * (`Intl.supportedValuesOf`), otherwise a curated fallback. UTC and the local
 * zone are always present and listed first.
 */
export function listTimeZones(): string[] {
  const intl = Intl as typeof Intl & {
    supportedValuesOf?: (key: string) => string[];
  };
  const supported = intl.supportedValuesOf?.("timeZone");
  const base = supported && supported.length ? supported : FALLBACK_TIMEZONES;
  return [...new Set<string>(["UTC", detectLocalTimeZone(), ...base])];
}
