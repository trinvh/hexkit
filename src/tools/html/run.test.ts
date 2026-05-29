import { describe, it, expect, vi, beforeEach } from "vitest";

const htmlEncode = vi.fn();
const htmlDecode = vi.fn();
vi.mock("./api", () => ({
  htmlEncode: (...args: unknown[]) => htmlEncode(...args),
  htmlDecode: (...args: unknown[]) => htmlDecode(...args),
}));

import { runHtml } from "./run";

describe("runHtml", () => {
  beforeEach(() => {
    htmlEncode.mockReset();
    htmlDecode.mockReset();
  });

  it("returns null for empty input", () => {
    expect(runHtml("", "encode")).toBeNull();
    expect(htmlEncode).not.toHaveBeenCalled();
  });

  it("encodes in encode mode", () => {
    htmlEncode.mockReturnValue(Promise.resolve("&lt;a&gt;"));
    runHtml("<a>", "encode");
    expect(htmlEncode).toHaveBeenCalledWith("<a>");
  });

  it("decodes in decode mode", () => {
    htmlDecode.mockReturnValue(Promise.resolve("<a>"));
    runHtml("&lt;a&gt;", "decode");
    expect(htmlDecode).toHaveBeenCalledWith("&lt;a&gt;");
  });
});
