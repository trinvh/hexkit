import { gzipCompress, gzipDecompress } from "./api";
import type { SegmentedOption } from "../../components/ui/Segmented";

export type GzipMode = "compress" | "decompress";

export const GZIP_MODES: ReadonlyArray<SegmentedOption<GzipMode>> = [
  { value: "compress", label: "Compress" },
  { value: "decompress", label: "Decompress" },
];

export function runGzip(
  input: string,
  mode: GzipMode,
): Promise<string> | null {
  if (input === "") return null;
  return mode === "compress" ? gzipCompress(input) : gzipDecompress(input);
}
