import { runAction } from "../../lib/ipc";

export function base64Encode(input: string): Promise<string> {
  return runAction<string>("base64.encode", { input });
}

export function base64Decode(input: string): Promise<string> {
  return runAction<string>("base64.decode", { input });
}
