import { numberConvert, numberToBase, type Bases } from "./api";

export interface BaseOption {
  value: string;
  label: string;
}

const NAMED_BASES: Record<number, string> = {
  2: "Binary",
  8: "Octal",
  10: "Decimal",
  16: "Hexadecimal",
};

/** All supported input bases (2-36), common ones labelled by name. */
export const NUMBER_BASES: ReadonlyArray<BaseOption> = Array.from(
  { length: 35 },
  (_, i) => {
    const base = i + 2;
    const name = NAMED_BASES[base];
    return { value: String(base), label: name ? `Base ${base} (${name})` : `Base ${base}` };
  },
);

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
