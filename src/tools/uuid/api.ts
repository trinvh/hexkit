import { runAction } from "../../lib/ipc";

export interface Inspection {
  kind: string;
  detail: string;
}

export function idGenerate(kind: string, count: number): Promise<string[]> {
  return runAction<string[]>("id.generate", { kind, count });
}

export function idInspect(value: string): Promise<Inspection> {
  return runAction<Inspection>("id.inspect", { value });
}
