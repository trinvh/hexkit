import { runAction } from "../../lib/ipc";

export function yamlToJson(input: string): Promise<string> {
  return runAction<string>("yaml.to_json", { input });
}

export function yamlFromJson(input: string): Promise<string> {
  return runAction<string>("yaml.from_json", { input });
}
