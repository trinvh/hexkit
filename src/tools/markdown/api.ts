import { runAction } from "../../lib/ipc";

export function markdownToHtml(input: string): Promise<string> {
  return runAction<string>("markdown.to_html", { input });
}
