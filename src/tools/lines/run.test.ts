import { describe, it, expect, vi, beforeEach } from "vitest";

const processLines = vi.fn();
vi.mock("./api", () => ({
  processLines: (...a: unknown[]) => processLines(...a),
}));

import { runLines } from "./run";

describe("runLines", () => {
  beforeEach(() => processLines.mockReset());

  it("returns null for empty input", () => {
    expect(
      runLines("", { sort: "none", dedupe: false, trim: false, caseInsensitive: false }),
    ).toBeNull();
  });

  it("forwards options to the backend", () => {
    processLines.mockReturnValue(Promise.resolve(""));
    const options = { sort: "asc", dedupe: true, trim: false, caseInsensitive: true };
    runLines("b\na", options);
    expect(processLines).toHaveBeenCalledWith("b\na", options);
  });
});
