import { describe, it, expect, vi, beforeEach } from "vitest";

const backslashEscape = vi.fn();
const backslashUnescape = vi.fn();
vi.mock("./api", () => ({
  backslashEscape: (...a: unknown[]) => backslashEscape(...a),
  backslashUnescape: (...a: unknown[]) => backslashUnescape(...a),
}));

import { runEscape } from "./run";

describe("runEscape", () => {
  beforeEach(() => {
    backslashEscape.mockReset();
    backslashUnescape.mockReset();
  });

  it("returns null for empty input", () => {
    expect(runEscape("", "escape")).toBeNull();
  });

  it("escapes and unescapes by mode", () => {
    backslashEscape.mockReturnValue(Promise.resolve("a\\nb"));
    runEscape("a\nb", "escape");
    expect(backslashEscape).toHaveBeenCalledWith("a\nb");

    backslashUnescape.mockReturnValue(Promise.resolve("a\nb"));
    runEscape("a\\nb", "unescape");
    expect(backslashUnescape).toHaveBeenCalledWith("a\\nb");
  });
});
