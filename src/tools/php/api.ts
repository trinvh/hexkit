import { runAction } from "../../lib/ipc";

export function phpToJson(input: string): Promise<string> {
  return runAction<string>("php.to_json", { input });
}

export function phpFromJson(input: string): Promise<string> {
  return runAction<string>("php.from_json", { input });
}
