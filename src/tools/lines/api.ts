import { runAction } from "../../lib/ipc";

export interface LinesOptions {
  sort: string;
  dedupe: boolean;
  trim: boolean;
  caseInsensitive: boolean;
}

export function processLines(
  input: string,
  options: LinesOptions,
): Promise<string> {
  return runAction<string>("lines.process", {
    input,
    sort: options.sort,
    dedupe: options.dedupe,
    trim: options.trim,
    case_insensitive: options.caseInsensitive,
  });
}
