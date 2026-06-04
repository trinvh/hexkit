import { describe, it, expect, vi, beforeEach } from "vitest";

const base32Encode = vi.fn();
const base32Decode = vi.fn();
vi.mock("./api", () => ({
  base32Encode: (...a: unknown[]) => base32Encode(...a),
  base32Decode: (...a: unknown[]) => base32Decode(...a),
}));

import { runBase32 } from "./run";

describe("runBase32", () => {
  beforeEach(() => {
    base32Encode.mockReset();
    base32Decode.mockReset();
  });

  it("returns null for empty input", () => {
    expect(runBase32("", "encode")).toBeNull();
  });

  it("encodes and decodes by mode", () => {
    base32Encode.mockReturnValue(Promise.resolve("MZXW6==="));
    runBase32("foo", "encode");
    expect(base32Encode).toHaveBeenCalledWith("foo");

    base32Decode.mockReturnValue(Promise.resolve("foo"));
    runBase32("MZXW6===", "decode");
    expect(base32Decode).toHaveBeenCalledWith("MZXW6===");
  });
});
