import { numberAll, type AllBases } from "./api";

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

/** All supported bases (2-36), common ones labelled by name. */
export const NUMBER_BASES: ReadonlyArray<BaseOption> = Array.from(
  { length: 35 },
  (_, i) => {
    const base = i + 2;
    const name = NAMED_BASES[base];
    return {
      value: String(base),
      label: name ? `Base ${base} (${name})` : `Base ${base}`,
    };
  },
);

/**
 * Read `value` (written in `base`) and render it in every base. Returns `null`
 * for blank input so the caller can skip the round-trip and clear the fields.
 */
export function runAll(
  value: string,
  base: number,
  customBase: number,
): Promise<AllBases> | null {
  if (value.trim() === "") return null;
  return numberAll(value, base, customBase);
}
