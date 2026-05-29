import { describe, it, expect, vi, beforeEach } from "vitest";

const regexpTest = vi.fn();
const regexpReplace = vi.fn();
vi.mock("./api", () => ({
  regexpTest: (...a: unknown[]) => regexpTest(...a),
  regexpReplace: (...a: unknown[]) => regexpReplace(...a),
}));

import { runRegexp, runReplace } from "./run";

describe("runRegexp", () => {
  beforeEach(() => {
    regexpTest.mockReset();
    regexpReplace.mockReset();
  });

  it("returns null when the pattern is empty", () => {
    expect(runRegexp("", "text", "")).toBeNull();
  });

  it("tests with pattern, text, and flags", () => {
    regexpTest.mockReturnValue(Promise.resolve({ matches: [] }));
    runRegexp("\\d+", "a1", "i");
    expect(regexpTest).toHaveBeenCalledWith("\\d+", "a1", "i");
  });
});

describe("runReplace", () => {
  beforeEach(() => {
    regexpTest.mockReset();
    regexpReplace.mockReset();
  });

  it("returns null when pattern or replacement is empty", () => {
    expect(runReplace("", "t", "", "x")).toBeNull();
    expect(runReplace("\\d", "t", "", "")).toBeNull();
  });

  it("replaces with pattern, text, flags, and replacement", () => {
    regexpReplace.mockReturnValue(Promise.resolve("done"));
    runReplace("\\d+", "a1", "i", "#");
    expect(regexpReplace).toHaveBeenCalledWith("\\d+", "a1", "i", "#");
  });
});
