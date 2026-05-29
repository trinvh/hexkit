import { curlToCode } from "./api";
import type { SegmentedOption } from "../../components/ui/Segmented";

export type CurlTarget = "js" | "python" | "go" | "php" | "rust";

export const CURL_TARGETS: ReadonlyArray<SegmentedOption<CurlTarget>> = [
  { value: "js", label: "JS" },
  { value: "python", label: "Python" },
  { value: "go", label: "Go" },
  { value: "php", label: "PHP" },
  { value: "rust", label: "Rust" },
];

export function runCurl(
  command: string,
  target: CurlTarget,
): Promise<string> | null {
  if (command.trim() === "") return null;
  return curlToCode(command, target);
}
