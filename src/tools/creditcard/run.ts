import { cardGenerate, type Brand, type GeneratedCard } from "./api";

export function runGenerate(
  brand: Brand,
  count: number,
): Promise<GeneratedCard[]> {
  return cardGenerate(brand, count);
}
