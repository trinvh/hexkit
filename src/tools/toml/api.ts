import { runAction } from "../../lib/ipc";

export function tomlToJson(input: string): Promise<string> {
  return runAction<string>("toml.to_json", { input });
}

export function tomlFromJson(input: string): Promise<string> {
  return runAction<string>("toml.from_json", { input });
}

export function tomlToYaml(input: string): Promise<string> {
  return runAction<string>("toml.to_yaml", { input });
}

export function tomlFromYaml(input: string): Promise<string> {
  return runAction<string>("toml.from_yaml", { input });
}
