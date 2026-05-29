import { runAction } from "../../lib/ipc";

export function loremGenerate(kind: string, count: number): Promise<string> {
  return runAction<string>("lorem.generate", { kind, count });
}
