import { describe, it, expect, vi, beforeEach } from "vitest";

const urlEncode = vi.fn();
const urlDecode = vi.fn();
vi.mock("./api", () => ({
  urlEncode: (...args: unknown[]) => urlEncode(...args),
  urlDecode: (...args: unknown[]) => urlDecode(...args),
}));

import { runUrl } from "./run";

describe("runUrl", () => {
  beforeEach(() => {
    urlEncode.mockReset();
    urlDecode.mockReset();
  });

  it("returns null for empty input", () => {
    expect(runUrl("", "encode")).toBeNull();
    expect(urlEncode).not.toHaveBeenCalled();
  });

  it("encodes in encode mode", () => {
    urlEncode.mockReturnValue(Promise.resolve("a%20b"));
    runUrl("a b", "encode");
    expect(urlEncode).toHaveBeenCalledWith("a b");
  });

  it("decodes in decode mode", () => {
    urlDecode.mockReturnValue(Promise.resolve("a b"));
    runUrl("a%20b", "decode");
    expect(urlDecode).toHaveBeenCalledWith("a%20b");
  });
});
