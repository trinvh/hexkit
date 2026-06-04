import { runAction } from "../../lib/ipc";

export interface ClassBits {
  read: boolean;
  write: boolean;
  execute: boolean;
}

export interface SpecialBits {
  setuid: boolean;
  setgid: boolean;
  sticky: boolean;
}

export interface ChmodMode {
  octal: string;
  symbolic: string;
  owner: ClassBits;
  group: ClassBits;
  others: ClassBits;
  special: SpecialBits;
}

export function chmodDescribe(input: string): Promise<ChmodMode> {
  return runAction<ChmodMode>("chmod.describe", { input });
}
