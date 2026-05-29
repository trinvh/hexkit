import { runAction } from "../../lib/ipc";

export function qrGenerate(input: string): Promise<string> {
  return runAction<string>("qr.generate", { input });
}

export function qrRead(imageBase64: string): Promise<string> {
  return runAction<string>("qr.read", { input: imageBase64 });
}
