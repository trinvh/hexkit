import { runAction } from "../../lib/ipc";

export function sqlFormat(input: string): Promise<string> {
  return runAction<string>("sql.format", { input });
}
