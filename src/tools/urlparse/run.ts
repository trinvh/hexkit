import { urlParse, type ParsedUrl } from "./api";

export function runUrlParse(input: string): Promise<ParsedUrl> | null {
  if (input.trim() === "") return null;
  return urlParse(input);
}
