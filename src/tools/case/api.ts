import { runAction } from "../../lib/ipc";

export interface Cases {
  camel: string;
  pascal: string;
  snake: string;
  kebab: string;
  constant: string;
  title: string;
  sentence: string;
  lower: string;
  upper: string;
}

export function caseConvert(input: string): Promise<Cases> {
  return runAction<Cases>("case.convert", { input });
}
