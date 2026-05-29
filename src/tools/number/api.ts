import { runAction } from "../../lib/ipc";

export interface AllBases {
  binary: string;
  octal: string;
  decimal: string;
  hexadecimal: string;
  custom: string;
}

/** Read `input` in `base` and render it in binary/octal/decimal/hex + `customBase`. */
export function numberAll(
  input: string,
  base: number,
  customBase: number,
): Promise<AllBases> {
  return runAction<AllBases>("number.all", {
    input,
    base,
    custom_base: customBase,
  });
}
