import { runAction } from "../../lib/ipc";

export function urlEncode(input: string): Promise<string> {
  return runAction<string>("url.encode", { input });
}

export function urlDecode(input: string): Promise<string> {
  return runAction<string>("url.decode", { input });
}
