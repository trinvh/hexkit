import { describe, it, expect, vi, beforeEach } from "vitest";

const timeConvert = vi.fn();
vi.mock("./api", () => ({
  timeConvert: (...args: unknown[]) => timeConvert(...args),
}));

import { runTime } from "./run";

describe("runTime", () => {
  beforeEach(() => timeConvert.mockReset());

  it("returns null for blank input", () => {
    expect(runTime("  ")).toBeNull();
    expect(timeConvert).not.toHaveBeenCalled();
  });

  it("calls the backend with the input and default unit", () => {
    timeConvert.mockReturnValue(Promise.resolve({}));
    runTime("1700000000");
    expect(timeConvert).toHaveBeenCalledWith("1700000000", "auto", "");
  });

  it("passes the chosen unit and timezone through", () => {
    timeConvert.mockReturnValue(Promise.resolve({}));
    runTime("1700000000", "ms", "Asia/Tokyo");
    expect(timeConvert).toHaveBeenCalledWith("1700000000", "ms", "Asia/Tokyo");
  });
});
