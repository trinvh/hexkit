import { describe, it, expect } from "vitest";
import { computeTextStats } from "./textStats";

describe("computeTextStats", () => {
  it("returns zeros for empty input", () => {
    expect(computeTextStats("")).toEqual({ chars: 0, words: 0, lines: 0 });
  });

  it("counts a single line", () => {
    expect(computeTextStats("hello world")).toEqual({
      chars: 11,
      words: 2,
      lines: 1,
    });
  });

  it("counts multiple lines and collapses repeated whitespace", () => {
    expect(computeTextStats("a  b\nc\n")).toEqual({
      chars: 7,
      words: 3,
      lines: 3,
    });
  });

  it("treats whitespace-only input as zero words but counts chars", () => {
    expect(computeTextStats("   ")).toEqual({ chars: 3, words: 0, lines: 1 });
  });

  it("handles CRLF and CR newlines", () => {
    expect(computeTextStats("a\r\nb\rc").lines).toBe(3);
  });
});
