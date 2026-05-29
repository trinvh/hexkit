import { jsonToCode } from "./api";
import type { SegmentedOption } from "../../components/ui/Segmented";

export type CodeTarget =
  | "typescript"
  | "go"
  | "rust"
  | "python"
  | "kotlin"
  | "swift";

export const CODE_TARGETS: ReadonlyArray<SegmentedOption<CodeTarget>> = [
  { value: "typescript", label: "TypeScript" },
  { value: "go", label: "Go" },
  { value: "rust", label: "Rust" },
  { value: "python", label: "Python" },
  { value: "kotlin", label: "Kotlin" },
  { value: "swift", label: "Swift" },
];

export function runJsonCode(
  input: string,
  target: CodeTarget,
): Promise<string> | null {
  if (input.trim() === "") return null;
  return jsonToCode(input, target);
}
