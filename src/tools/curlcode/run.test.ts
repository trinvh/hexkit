import { describe, it, expect, vi, beforeEach } from "vitest";

const curlToCode = vi.fn();
vi.mock("./api", () => ({
  curlToCode: (...a: unknown[]) => curlToCode(...a),
}));

import { runCurl } from "./run";

describe("runCurl", () => {
  beforeEach(() => curlToCode.mockReset());

  it("returns null for blank command", () => {
    expect(runCurl("  ", "js")).toBeNull();
  });

  it("generates code for the chosen target", () => {
    curlToCode.mockReturnValue(Promise.resolve(""));
    runCurl("curl https://x.com", "python");
    expect(curlToCode).toHaveBeenCalledWith("curl https://x.com", "python");
  });
});
