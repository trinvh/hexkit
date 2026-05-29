import { runAction } from "../../lib/ipc";

export interface RandomOptions {
  length: number;
  uppercase: boolean;
  lowercase: boolean;
  digits: boolean;
  symbols: boolean;
}

export function randomGenerate(options: RandomOptions): Promise<string> {
  return runAction<string>("random.generate", { ...options });
}
