import type { SegmentedOption } from "../../components/ui/Segmented";
import type { TotpAlgorithm } from "./api";

export const ALGORITHM_OPTIONS: ReadonlyArray<SegmentedOption<TotpAlgorithm>> =
  [
    { value: "SHA1", label: "SHA-1" },
    { value: "SHA256", label: "SHA-256" },
    { value: "SHA512", label: "SHA-512" },
  ];

export type Digits = "6" | "8";

export const DIGIT_OPTIONS: ReadonlyArray<SegmentedOption<Digits>> = [
  { value: "6", label: "6 digits" },
  { value: "8", label: "8 digits" },
];

export type Period = "30" | "60";

export const PERIOD_OPTIONS: ReadonlyArray<SegmentedOption<Period>> = [
  { value: "30", label: "30s" },
  { value: "60", label: "60s" },
];

/** Current wall-clock time as whole unix seconds. */
export function nowUnixSeconds(): number {
  return Math.floor(Date.now() / 1000);
}
