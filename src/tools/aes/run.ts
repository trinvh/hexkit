import { aesDecrypt, aesEncrypt } from "./api";
import type { SegmentedOption } from "../../components/ui/Segmented";

export type AesMode = "encrypt" | "decrypt";

export const AES_MODES: ReadonlyArray<SegmentedOption<AesMode>> = [
  { value: "encrypt", label: "Encrypt" },
  { value: "decrypt", label: "Decrypt" },
];

export function runAes(
  input: string,
  password: string,
  mode: AesMode,
): Promise<string> | null {
  if (input === "" || password === "") return null;
  return mode === "encrypt"
    ? aesEncrypt(input, password)
    : aesDecrypt(input, password);
}
