import { describe, it, expect, vi, beforeEach } from "vitest";

const numberConvert = vi.fn();
vi.mock("./api", () => ({
  numberConvert: (...args: unknown[]) => numberConvert(...args),
}));

import { runNumber } from "./run";

describe("runNumber", () => {
  beforeEach(() => numberConvert.mockReset());

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
