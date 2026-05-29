import { regexpTest, type RegexResult } from "./api";

export function runRegexp(
  pattern: string,
  text: string,
  flags: string,
): Promise<RegexResult> | null {
  if (pattern === "") return null;
  return regexpTest(pattern, text, flags);
}
