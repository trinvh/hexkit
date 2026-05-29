import { runAction } from "../../lib/ipc";

export function csvToJson(input: string): Promise<string> {
  return runAction<string>("csv.to_json", { input });
}

export function csvFromJson(input: string): Promise<string> {
  return runAction<string>("csv.from_json", { input });
}
