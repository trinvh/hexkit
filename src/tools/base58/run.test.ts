import { describe, it, expect, vi, beforeEach } from "vitest";

const base58Encode = vi.fn();
const base58Decode = vi.fn();
vi.mock("./api", () => ({
  base58Encode: (...a: unknown[]) => base58Encode(...a),
  base58Decode: (...a: unknown[]) => base58Decode(...a),
}));

import { runBase58 } from "./run";

describe("runBase58", () => {
  beforeEach(() => {
    base58Encode.mockReset();
    base58Decode.mockReset();
  });

  it("returns null for empty input", () => {
    expect(runBase58("", "encode")).toBeNull();
  });

  it("encodes and decodes by mode", () => {
    base58Encode.mockReturnValue(Promise.resolve("Cn8eVZg"));
    runBase58("hello", "encode");
    expect(base58Encode).toHaveBeenCalledWith("hello");

    base58Decode.mockReturnValue(Promise.resolve("hello"));
    runBase58("Cn8eVZg", "decode");
    expect(base58Decode).toHaveBeenCalledWith("Cn8eVZg");
  });
});
