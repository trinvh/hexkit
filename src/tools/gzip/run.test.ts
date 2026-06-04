import { describe, it, expect, vi, beforeEach } from "vitest";

const gzipCompress = vi.fn();
const gzipDecompress = vi.fn();
vi.mock("./api", () => ({
  gzipCompress: (...a: unknown[]) => gzipCompress(...a),
  gzipDecompress: (...a: unknown[]) => gzipDecompress(...a),
}));

import { runGzip } from "./run";

describe("runGzip", () => {
  beforeEach(() => {
    gzipCompress.mockReset();
    gzipDecompress.mockReset();
  });

  it("returns null for empty input", () => {
    expect(runGzip("", "compress")).toBeNull();
  });

  it("compresses and decompresses by mode", () => {
    gzipCompress.mockReturnValue(Promise.resolve("H4sI..."));
    runGzip("hello", "compress");
    expect(gzipCompress).toHaveBeenCalledWith("hello");

    gzipDecompress.mockReturnValue(Promise.resolve("hello"));
    runGzip("H4sI...", "decompress");
    expect(gzipDecompress).toHaveBeenCalledWith("H4sI...");
  });
});
