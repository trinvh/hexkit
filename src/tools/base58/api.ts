import { runAction } from "../../lib/ipc";

export function base58Encode(input: string): Promise<string> {
  return runAction<string>("base58.encode", { input });
}

export function base58Decode(input: string): Promise<string> {
  return runAction<string>("base58.decode", { input });
}
