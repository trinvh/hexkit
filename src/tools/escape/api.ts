import { runAction } from "../../lib/ipc";

export function backslashEscape(input: string): Promise<string> {
  return runAction<string>("escape.escape", { input });
}

export function backslashUnescape(input: string): Promise<string> {
  return runAction<string>("escape.unescape", { input });
}
