import { runAction } from "../../lib/ipc";

export function svgToCss(input: string): Promise<string> {
  return runAction<string>("svg.to_css", { input });
}
