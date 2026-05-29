import { regexpTest, regexpReplace, type RegexResult } from "./api";

export function runRegexp(
  pattern: string,
  text: string,
  flags: string,
): Promise<RegexResult> | null {
  if (pattern === "") return null;
  return regexpTest(pattern, text, flags);
}

/** Substitute matches; runs only when both a pattern and replacement exist. */
export function runReplace(
  pattern: string,
  text: string,
  flags: string,
  replacement: string,
): Promise<string> | null {
  if (pattern === "" || replacement === "") return null;
  return regexpReplace(pattern, text, flags, replacement);
}
