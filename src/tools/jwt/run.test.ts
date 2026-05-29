import { describe, it, expect, vi, beforeEach } from "vitest";

const jwtDecode = vi.fn();
vi.mock("./api", () => ({
  jwtDecode: (...args: unknown[]) => jwtDecode(...args),
}));

import { runJwt } from "./run";

describe("runJwt", () => {
  beforeEach(() => jwtDecode.mockReset());

  it("returns null for blank input", () => {
    expect(runJwt("  ")).toBeNull();
    expect(jwtDecode).not.toHaveBeenCalled();
  });

  it("decodes a non-empty token", () => {
    jwtDecode.mockReturnValue(Promise.resolve({}));
    runJwt("a.b.c");
    expect(jwtDecode).toHaveBeenCalledWith("a.b.c");
  });
});
