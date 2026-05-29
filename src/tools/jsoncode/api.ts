import { runAction } from "../../lib/ipc";

export function jsonToCode(input: string, target: string): Promise<string> {
  return runAction<string>("jsoncode.generate", { input, target });
}
