import { describe, it, expect, vi, beforeEach } from "vitest";

const hexEncode = vi.fn();
const hexDecode = vi.fn();
vi.mock("./api", () => ({
  hexEncode: (...a: unknown[]) => hexEncode(...a),
  hexDecode: (...a: unknown[]) => hexDecode(...a),
}));

import { runHex } from "./run";

describe("runHex", () => {
  beforeEach(() => {
    hexEncode.mockReset();
    hexDecode.mockReset();
  });

  it("returns null for empty input", () => {
    expect(runHex("", "encode")).toBeNull();
  });

  it("encodes and decodes by mode", () => {
    hexEncode.mockReturnValue(Promise.resolve("4142"));
    runHex("AB", "encode");
    expect(hexEncode).toHaveBeenCalledWith("AB");

    hexDecode.mockReturnValue(Promise.resolve("AB"));
    runHex("4142", "decode");
    expect(hexDecode).toHaveBeenCalledWith("4142");
  });
});
