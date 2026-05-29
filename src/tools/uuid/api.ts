import { runAction } from "../../lib/ipc";

export interface Inspection {
  kind: string;
  version: string;
  variant: string;
  canonical: string;
  raw: string;
  detail: string;
}

export function idGenerate(
  kind: string,
  count: number,
  lowercased = false,
): Promise<string[]> {
  return runAction<string[]>("id.generate", { kind, count, lowercased });
}

export function idInspect(value: string): Promise<Inspection> {
  return runAction<Inspection>("id.inspect", { value });
}
