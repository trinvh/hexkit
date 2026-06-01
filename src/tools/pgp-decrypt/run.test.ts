import { describe, it, expect, vi, beforeEach } from "vitest";

const pgpDecrypt = vi.fn();
vi.mock("./api", () => ({
  pgpDecrypt: (...args: unknown[]) => pgpDecrypt(...args),
}));

import { runDecrypt } from "./run";

describe("runDecrypt", () => {
  beforeEach(() => pgpDecrypt.mockReset());

  it("returns null without both ciphertext and key", () => {
    expect(runDecrypt(" ", "key", "")).toBeNull();
    expect(runDecrypt("ct", "  ", "")).toBeNull();
    expect(pgpDecrypt).not.toHaveBeenCalled();
  });

  it("passes passphrase through to backend", () => {
    pgpDecrypt.mockReturnValue(Promise.resolve({ plaintext: "" }));
    runDecrypt("ct", "key", "pw");
    expect(pgpDecrypt).toHaveBeenCalledWith("ct", "key", "pw");
  });
});
