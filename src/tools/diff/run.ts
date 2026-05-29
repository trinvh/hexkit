import { diffCompare, type DiffLine } from "./api";

export function runDiff(
  oldText: string,
  newText: string,
): Promise<DiffLine[]> | null {
  if (oldText === "" && newText === "") return null;
  return diffCompare(oldText, newText);
}
