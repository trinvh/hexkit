import { runAction } from "../../lib/ipc";

export interface DiffLine {
  tag: "equal" | "insert" | "delete";
  value: string;
}

export function diffCompare(
  oldText: string,
  newText: string,
): Promise<DiffLine[]> {
  return runAction<DiffLine[]>("diff.compare", { old: oldText, new: newText });
}
