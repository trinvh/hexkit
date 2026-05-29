import { runAction } from "../../lib/ipc";

export function jsxFromHtml(input: string): Promise<string> {
  return runAction<string>("jsx.from_html", { input });
}
