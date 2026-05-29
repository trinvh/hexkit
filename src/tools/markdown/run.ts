import { markdownToHtml } from "./api";

export function runMarkdown(input: string): Promise<string> | null {
  if (input.trim() === "") return null;
  return markdownToHtml(input);
}
