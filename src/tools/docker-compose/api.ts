import { runAction } from "../../lib/ipc";

export function dockerRunToCompose(input: string): Promise<string> {
  return runAction<string>("dockerc.to_compose", { input });
}
