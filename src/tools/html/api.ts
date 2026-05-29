import { runAction } from "../../lib/ipc";

export function htmlEncode(input: string): Promise<string> {
  return runAction<string>("html.encode", { input });
}

export function htmlDecode(input: string): Promise<string> {
  return runAction<string>("html.decode", { input });
}
