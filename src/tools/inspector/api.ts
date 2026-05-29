import { runAction } from "../../lib/ipc";

export interface Stats {
  characters: number;
  bytes: number;
  words: number;
  lines: number;
}

export function inspectString(input: string): Promise<Stats> {
  return runAction<Stats>("string.inspect", { input });
}
