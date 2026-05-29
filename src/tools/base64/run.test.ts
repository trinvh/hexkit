import { describe, it, expect, vi, beforeEach } from "vitest";

const base64Encode = vi.fn();
const base64Decode = vi.fn();
vi.mock("./api", () => ({
  base64Encode: (...args: unknown[]) => base64Encode(...args),
  base64Decode: (...args: unknown[]) => base64Decode(...args),
}));

import { runBase64 } from "./run";

describe("runBase64", () => {
  beforeEach(() => {
    base64Encode.mockReset();
    base64Decode.mockReset();
  });

  it("returns null for empty input without calling the backend", () => {
    expect(runBase64("", "encode")).toBeNull();
    expect(base64Encode).not.toHaveBeenCalled();
    expect(base64Decode).not.toHaveBeenCalled();
  });

  it("encodes in encode mode", () => {
    base64Encode.mockReturnValue(Promise.resolve("aGk="));
    runBase64("hi", "encode");
    expect(base64Encode).toHaveBeenCalledWith("hi");
    expect(base64Decode).not.toHaveBeenCalled();
  });

  it("decodes in decode mode", () => {
    base64Decode.mockReturnValue(Promise.resolve("hi"));
    runBase64("aGk=", "decode");
    expect(base64Decode).toHaveBeenCalledWith("aGk=");
    expect(base64Encode).not.toHaveBeenCalled();
  });

  it("preserves whitespace-only input for encoding", () => {
    base64Encode.mockReturnValue(Promise.resolve("ICAg"));
    runBase64("   ", "encode");
    expect(base64Encode).toHaveBeenCalledWith("   ");
  });
});
