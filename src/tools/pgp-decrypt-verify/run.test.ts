import { describe, it, expect, vi, beforeEach } from "vitest";

const pgpDecryptVerify = vi.fn();
vi.mock("./api", () => ({
  pgpDecryptVerify: (...args: unknown[]) => pgpDecryptVerify(...args),
}));

import { runDecryptVerify } from "./run";

describe("runDecryptVerify", () => {
  beforeEach(() => pgpDecryptVerify.mockReset());

  it("returns null until ciphertext + both keys are present", () => {
    expect(runDecryptVerify(" ", "priv", "", "pub")).toBeNull();
    expect(runDecryptVerify("ct", " ", "", "pub")).toBeNull();
    expect(runDecryptVerify("ct", "priv", "", " ")).toBeNull();
    expect(pgpDecryptVerify).not.toHaveBeenCalled();
  });

  it("forwards arguments to backend in correct order", () => {
    pgpDecryptVerify.mockReturnValue(Promise.resolve({}));
    runDecryptVerify("ct", "PRIV", "pw", "PUB");
    expect(pgpDecryptVerify).toHaveBeenCalledWith("ct", "PRIV", "pw", "PUB");
  });
});
