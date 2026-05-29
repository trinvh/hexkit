import { runAction } from "../../lib/ipc";

export function hexEncode(input: string): Promise<string> {
  return runAction<string>("hex.encode", { input });
}

export function hexDecode(input: string): Promise<string> {
  return runAction<string>("hex.decode", { input });
}
