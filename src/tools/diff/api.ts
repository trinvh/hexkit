import { runAction } from "../../lib/ipc";

export interface DiffLine {
  tag: "equal" | "insert" | "delete";
  value: string;
}

export type DiffFormat = "text" | "json" | "xml";

export function diffCompare(
  oldText: string,
  newText: string,
  format: DiffFormat = "text",
  sort = false,
): Promise<DiffLine[]> {
  return runAction<DiffLine[]>("diff.compare", {
    old: oldText,
    new: newText,
    format,
    sort,
  });
}
