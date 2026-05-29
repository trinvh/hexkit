import { caseConvert, type Cases } from "./api";

export const CASE_ROWS: ReadonlyArray<{ key: keyof Cases; label: string }> = [
  { key: "camel", label: "camelCase" },
  { key: "pascal", label: "PascalCase" },
  { key: "snake", label: "snake_case" },
  { key: "kebab", label: "kebab-case" },
  { key: "constant", label: "CONSTANT_CASE" },
  { key: "title", label: "Title Case" },
  { key: "sentence", label: "Sentence case" },
  { key: "lower", label: "lower case" },
  { key: "upper", label: "UPPER CASE" },
];

export function runCase(input: string): Promise<Cases> | null {
  if (input.trim() === "") return null;
  return caseConvert(input);
}
