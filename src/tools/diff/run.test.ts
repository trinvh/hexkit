import { describe, it, expect, vi, beforeEach } from "vitest";

const diffCompare = vi.fn();
vi.mock("./api", () => ({
  diffCompare: (...args: unknown[]) => diffCompare(...args),
}));

import { runDiff } from "./run";

describe("runDiff", () => {
  beforeEach(() => diffCompare.mockReset());

  it("returns null when both sides are empty", () => {
    expect(runDiff("", "")).toBeNull();
    expect(diffCompare).not.toHaveBeenCalled();
  });

  it("compares with default text format when either side has content", () => {
    diffCompare.mockReturnValue(Promise.resolve([]));
    runDiff("a", "");
    expect(diffCompare).toHaveBeenCalledWith("a", "", "text", false);
  });

  it("passes the format and sort flag through", () => {
    diffCompare.mockReturnValue(Promise.resolve([]));
    runDiff("{}", "{}", "json", true);
    expect(diffCompare).toHaveBeenCalledWith("{}", "{}", "json", true);
  });
});
