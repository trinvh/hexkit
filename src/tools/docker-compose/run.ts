import { dockerRunToCompose } from "./api";

export function runDockerCompose(input: string): Promise<string> | null {
  if (input.trim() === "") return null;
  return dockerRunToCompose(input);
}
