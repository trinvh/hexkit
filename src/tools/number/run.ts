import { numberConvert, numberToBase, type Bases } from "./api";
import type { SegmentedOption } from "../../components/ui/Segmented";

export const NUMBER_BASES: ReadonlyArray<SegmentedOption<string>> = [
  { value: "10", label: "Decimal" },
  { value: "16", label: "Hex" },
  { value: "2", label: "Binary" },
  { value: "8", label: "Octal" },
];

export function runNumber(input: string, base: string): Promise<Bases> | null {
  if (input.trim() === "") return null;
  return numberConvert(input, Number(base));
}

/** Render the input (in `fromBase`) into an arbitrary `customBase` (2-36). */
export function runCustomBase(
  input: string,
  fromBase: string,
  customBase: string,
): Promise<string> | null {
  const target = Number(customBase);
  if (
    input.trim() === "" ||
    !Number.isInteger(target) ||
    target < 2 ||
    target > 36
  ) {
    return null;
  }
  return numberToBase(input, Number(fromBase), target);
}
