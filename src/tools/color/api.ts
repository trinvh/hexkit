import { runAction } from "../../lib/ipc";

export interface ColorOut {
  hex: string;
  rgb: string;
  hsl: string;
}

export function colorConvert(input: string): Promise<ColorOut> {
  return runAction<ColorOut>("color.convert", { input });
}
