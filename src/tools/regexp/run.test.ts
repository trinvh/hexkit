import { describe, it, expect, vi, beforeEach } from "vitest";

const regexpTest = vi.fn();
vi.mock("./api", () => ({
  regexpTest: (...a: unknown[]) => regexpTest(...a),
}));

import { runRegexp } from "./run";

describe("runRegexp", () => {
  beforeEach(() => regexpTest.mockReset());

  it("returns null when the pattern is empty", () => {
    expect(runRegexp("", "text", "")).toBeNull();
  });

  it("tests with pattern, text, and flags", () => {
    regexpTest.mockReturnValue(Promise.resolve({ matches: [] }));
    runRegexp("\\d+", "a1", "i");
    expect(regexpTest).toHaveBeenCalledWith("\\d+", "a1", "i");
  });
});
