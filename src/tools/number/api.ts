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
