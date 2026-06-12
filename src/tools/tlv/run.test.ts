import { describe, it, expect, vi, beforeEach } from "vitest";

const tlvDecode = vi.fn();
vi.mock("./api", () => ({
  tlvDecode: (...a: unknown[]) => tlvDecode(...a),
}));

import { runTlv } from "./run";

describe("runTlv", () => {
  beforeEach(() => tlvDecode.mockReset());

  it("returns null for blank input", () => {
    expect(runTlv("   ", "hex")).toBeNull();
    expect(tlvDecode).not.toHaveBeenCalled();
  });

  it("passes the selected encoding through to the backend", () => {
    tlvDecode.mockReturnValue(Promise.resolve([]));
    runTlv("5004", "hex");
    expect(tlvDecode).toHaveBeenCalledWith("5004", "hex");

    runTlv("UAQ=", "base64");
    expect(tlvDecode).toHaveBeenCalledWith("UAQ=", "base64");
  });
});
