import { runAction } from "../../lib/ipc";

export function base32Encode(input: string): Promise<string> {
  return runAction<string>("base32.encode", { input });
}

export function base32Decode(input: string): Promise<string> {
  return runAction<string>("base32.decode", { input });
}
