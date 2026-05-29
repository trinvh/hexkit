import { runAction } from "../../lib/ipc";

export function cssBeautify(input: string, syntax: string): Promise<string> {
  return runAction<string>("css.beautify", { input, syntax });
}

export function cssMinify(input: string, syntax: string): Promise<string> {
  return runAction<string>("css.minify", { input, syntax });
}
