import { svgToCss } from "./api";

export function runSvg(input: string): Promise<string> | null {
  if (input.trim() === "") return null;
  return svgToCss(input);
}
