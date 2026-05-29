import { jsxFromHtml } from "./api";

export function runJsx(input: string): Promise<string> | null {
  if (input === "") return null;
  return jsxFromHtml(input);
}
