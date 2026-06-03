import { describe, it, expect } from "vitest";
import { isLargeText, LARGE_TEXT_THRESHOLD } from "./largeText";

describe("isLargeText", () => {
  it("is false at and below the threshold", () => {
    expect(isLargeText("")).toBe(false);
    expect(isLargeText("x".repeat(LARGE_TEXT_THRESHOLD))).toBe(false);
  });

  it("is true above the threshold", () => {
    expect(isLargeText("x".repeat(LARGE_TEXT_THRESHOLD + 1))).toBe(true);
  });
});
