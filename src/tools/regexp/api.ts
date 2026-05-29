import { runAction } from "../../lib/ipc";

export interface RegexMatch {
  value: string;
  index: number;
  groups: (string | null)[];
}

export interface RegexResult {
  matches: RegexMatch[];
}

export function regexpTest(
  pattern: string,
  text: string,
  flags: string,
): Promise<RegexResult> {
  return runAction<RegexResult>("regexp.test", { pattern, text, flags });
}

export function regexpReplace(
  pattern: string,
  text: string,
  flags: string,
  replacement: string,
): Promise<string> {
  return runAction<string>("regexp.replace", {
    pattern,
    text,
    flags,
    replacement,
  });
}
