import { runAction } from "../../lib/ipc";

export function pgpEncrypt(input: string, public_key: string): Promise<string> {
  return runAction<string>("pgp.encrypt", { input, public_key });
}
