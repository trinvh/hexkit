import { runAction } from "../../lib/ipc";

export type JsonIndent = "  " | "    " | "\t";

export function jsonFormat(
  input: string,
  indent: JsonIndent,
  sort = false,
): Promise<string> {
  return runAction<string>("json.format", { input, indent, sort });
}

export function jsonMinify(input: string): Promise<string> {
  return runAction<string>("json.minify", { input });
}

export function jsonQuery(
  input: string,
  path: string,
  indent: JsonIndent,
): Promise<string> {
  return runAction<string>("json.query", { input, path, indent });
}
