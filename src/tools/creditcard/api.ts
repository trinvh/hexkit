import { runAction } from "../../lib/ipc";

export const BRANDS = [
  { value: "visa", label: "Visa" },
  { value: "mastercard", label: "Mastercard" },
  { value: "amex", label: "Amex" },
  { value: "discover", label: "Discover" },
  { value: "jcb", label: "JCB" },
  { value: "diners", label: "Diners" },
  { value: "union_pay", label: "UnionPay" },
] as const;

export type Brand = (typeof BRANDS)[number]["value"];

export interface GeneratedCard {
  number: string;
  formatted: string;
  brand: string;
}

export async function cardGenerate(
  brand: Brand,
  count: number,
): Promise<GeneratedCard[]> {
  return runAction<GeneratedCard[]>("card.generate", { brand, count });
}
