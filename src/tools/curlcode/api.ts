import { runAction } from "../../lib/ipc";

export function curlToCode(command: string, target: string): Promise<string> {
  return runAction<string>("curl.to_code", { command, target });
}
