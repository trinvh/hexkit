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
    expect(runHex("", "encode", "upper", "")).toBeNull();
  });

  it("encodes with case and delimiter options", () => {
    hexEncode.mockReturnValue(Promise.resolve("41:42"));
    runHex("AB", "encode", "upper", ":");
    expect(hexEncode).toHaveBeenCalledWith("AB", true, ":");

    runHex("AB", "encode", "lower", "");
    expect(hexEncode).toHaveBeenCalledWith("AB", false, "");
  });

  it("decodes regardless of case and delimiter options", () => {
    hexDecode.mockReturnValue(Promise.resolve("AB"));
    runHex("4142", "decode", "upper", ":");
    expect(hexDecode).toHaveBeenCalledWith("4142");
  });
});
