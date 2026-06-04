import { describe, it, expect, vi, beforeEach } from "vitest";

const cidrParse = vi.fn();
vi.mock("./api", () => ({
  cidrParse: (...args: unknown[]) => cidrParse(...args),
}));

import { runCidr } from "./run";

describe("runCidr", () => {
  beforeEach(() => cidrParse.mockReset());

  it("returns null for blank input", () => {
    expect(runCidr("   ")).toBeNull();
    expect(cidrParse).not.toHaveBeenCalled();
  });

  it("parses a non-empty block", () => {
    cidrParse.mockReturnValue(Promise.resolve({}));
    runCidr("192.168.1.0/24");
    expect(cidrParse).toHaveBeenCalledWith("192.168.1.0/24");
  });
});
