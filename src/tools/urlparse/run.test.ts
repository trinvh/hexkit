import { describe, it, expect, vi, beforeEach } from "vitest";

const urlParse = vi.fn();
vi.mock("./api", () => ({
  urlParse: (...args: unknown[]) => urlParse(...args),
}));

import { runUrlParse } from "./run";

describe("runUrlParse", () => {
  beforeEach(() => urlParse.mockReset());

  it("returns null for blank input", () => {
    expect(runUrlParse("   ")).toBeNull();
    expect(urlParse).not.toHaveBeenCalled();
  });

  it("parses a non-empty url", () => {
    urlParse.mockReturnValue(Promise.resolve({}));
    runUrlParse("https://example.com");
    expect(urlParse).toHaveBeenCalledWith("https://example.com");
  });
});
