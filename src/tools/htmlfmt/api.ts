import { runAction } from "../../lib/ipc";

export function htmlBeautify(input: string): Promise<string> {
  return runAction<string>("htmlfmt.beautify", { input });
}

export function htmlMinify(input: string): Promise<string> {
  return runAction<string>("htmlfmt.minify", { input });
}
