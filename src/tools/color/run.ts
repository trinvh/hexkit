import { colorConvert, type ColorOut } from "./api";

export function runColor(input: string): Promise<ColorOut> | null {
  if (input.trim() === "") return null;
  return colorConvert(input);
}
