import { sqlFormat } from "./api";

export function runSql(input: string): Promise<string> | null {
  if (input.trim() === "") return null;
  return sqlFormat(input);
}
