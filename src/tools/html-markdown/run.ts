import { htmlToMarkdown } from "./api";

export function runHtmlMarkdown(input: string): Promise<string> | null {
  if (input === "") return null;
  return htmlToMarkdown(input);
}
