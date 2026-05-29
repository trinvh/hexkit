import { describe, it, expect, vi, beforeEach } from "vitest";

const numberConvert = vi.fn();
const numberToBase = vi.fn();
vi.mock("./api", () => ({
  numberConvert: (...args: unknown[]) => numberConvert(...args),
  numberToBase: (...args: unknown[]) => numberToBase(...args),
}));

import { runNumber, runCustomBase } from "./run";

describe("runNumber", () => {
  beforeEach(() => {
    numberConvert.mockReset();
    numberToBase.mockReset();
  });

  it("returns null for blank input", () => {
    expect(runNumber("  ", "10")).toBeNull();
    expect(numberConvert).not.toHaveBeenCalled();
  });

  it("calls the backend with a numeric base", () => {
    numberConvert.mockReturnValue(Promise.resolve({}));
    runNumber("ff", "16");
    expect(numberConvert).toHaveBeenCalledWith("ff", 16);
  });
});

describe("runCustomBase", () => {
  beforeEach(() => {
    numberConvert.mockReset();
    numberToBase.mockReset();
  });

  it("returns null for blank input or an out-of-range base", () => {
    expect(runCustomBase("  ", "10", "36")).toBeNull();
    expect(runCustomBase("10", "10", "99")).toBeNull();
    expect(runCustomBase("10", "10", "1")).toBeNull();
    expect(numberToBase).not.toHaveBeenCalled();
  });

  it("renders input from one base into the chosen target base", () => {
    numberToBase.mockReturnValue(Promise.resolve("73"));
    runCustomBase("255", "10", "36");
    expect(numberToBase).toHaveBeenCalledWith("255", 10, 36);
  });
});
