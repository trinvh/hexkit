import { runAction } from "../../lib/ipc";

export function gzipCompress(input: string): Promise<string> {
  return runAction<string>("gzip.compress", { input });
}

export function gzipDecompress(input: string): Promise<string> {
  return runAction<string>("gzip.decompress", { input });
}
