import { runAction } from "../../lib/ipc";

export function aesEncrypt(
  plaintext: string,
  password: string,
): Promise<string> {
  return runAction<string>("aes.encrypt", { plaintext, password });
}

export function aesDecrypt(input: string, password: string): Promise<string> {
  return runAction<string>("aes.decrypt", { input, password });
}
