import { runAction } from "../../lib/ipc";

export function htmlToMarkdown(input: string): Promise<string> {
  return runAction<string>("htmlmd.convert", { input });
}
