import { runAction } from "../../lib/ipc";

export type JsonIndent = "  " | "    " | "\t";

export function jsonFormat(input: string, indent: JsonIndent): Promise<string> {
  return runAction<string>("json.format", { input, indent });
}

export function jsonMinify(input: string): Promise<string> {
  return runAction<string>("json.minify", { input });
}
