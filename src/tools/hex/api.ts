import { runAction } from "../../lib/ipc";

export function hexEncode(
  input: string,
  uppercase: boolean,
  delimiter: string,
): Promise<string> {
  return runAction<string>("hex.encode", { input, uppercase, delimiter });
}

export function hexDecode(input: string): Promise<string> {
  return runAction<string>("hex.decode", { input });
}
