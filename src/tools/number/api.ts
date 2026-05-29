import { runAction } from "../../lib/ipc";

export interface Bases {
  binary: string;
  octal: string;
  decimal: string;
  hexadecimal: string;
}

export function numberConvert(input: string, base: number): Promise<Bases> {
  return runAction<Bases>("number.convert", { input, base });
}

export function numberToBase(
  input: string,
  fromBase: number,
  toBase: number,
): Promise<string> {
  return runAction<string>("number.to_base", {
    input,
    from_base: fromBase,
    to_base: toBase,
  });
}
