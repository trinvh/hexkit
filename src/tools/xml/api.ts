import { runAction } from "../../lib/ipc";

export function xmlBeautify(input: string): Promise<string> {
  return runAction<string>("xml.beautify", { input });
}

export function xmlMinify(input: string): Promise<string> {
  return runAction<string>("xml.minify", { input });
}

export function xmlQuery(input: string, xpath: string): Promise<string> {
  return runAction<string>("xml.query", { input, xpath });
}
