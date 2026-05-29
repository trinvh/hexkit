import { describe, it, expect, vi, beforeEach } from "vitest";

const hashGenerate = vi.fn();
const hashHmac = vi.fn();
vi.mock("./api", () => ({
  hashGenerate: (...a: unknown[]) => hashGenerate(...a),
  hashHmac: (...a: unknown[]) => hashHmac(...a),
}));

import { runDigests } from "./run";

describe("runDigests", () => {
  beforeEach(() => {
    hashGenerate.mockReset();
    hashHmac.mockReset();
  });

  it("returns null for empty input", () => {
    expect(runDigests("", "")).toBeNull();
    expect(hashGenerate).not.toHaveBeenCalled();
  });

  it("computes plain digests when no key is given", () => {
    hashGenerate.mockReturnValue(Promise.resolve({ md5: "x" }));
    runDigests("hello", "");
    expect(hashGenerate).toHaveBeenCalledWith("hello");
    expect(hashHmac).not.toHaveBeenCalled();
  });

  it("computes HMAC digests for each algorithm when a key is given", async () => {
    hashHmac.mockImplementation((algo: string) => Promise.resolve(`${algo}-digest`));
    const result = await runDigests("hello", "secret")!;
    expect(hashHmac).toHaveBeenCalledWith("md5", "secret", "hello");
    expect(hashHmac).toHaveBeenCalledWith("sha512", "secret", "hello");
    expect(result).toEqual({
      md5: "md5-digest",
      sha1: "sha1-digest",
      sha256: "sha256-digest",
      sha512: "sha512-digest",
    });
  });
});
