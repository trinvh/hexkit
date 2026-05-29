import { runAction } from "../../lib/ipc";

export interface ColorOut {
  hex: string;
  hex8: string;
  rgb: string;
  rgba: string;
  hsl: string;
  hsla: string;
  hsb: string;
  hwb: string;
  cmyk: string;
}

export function colorConvert(input: string): Promise<ColorOut> {
  return runAction<ColorOut>("color.convert", { input });
}
