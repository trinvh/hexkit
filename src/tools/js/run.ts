import { jsMinify } from "./api";

export function runJs(input: string): Promise<string> | null {
  if (input.trim() === "") return null;
  return jsMinify(input);
}
