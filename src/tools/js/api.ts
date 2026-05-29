import { runAction } from "../../lib/ipc";

export function jsMinify(input: string): Promise<string> {
  return runAction<string>("js.minify", { input });
}
