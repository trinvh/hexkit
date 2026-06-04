import { describe, it, expect, vi, beforeEach } from "vitest";

const aesEncrypt = vi.fn();
const aesDecrypt = vi.fn();
vi.mock("./api", () => ({
  aesEncrypt: (...a: unknown[]) => aesEncrypt(...a),
  aesDecrypt: (...a: unknown[]) => aesDecrypt(...a),
}));

import { runAes } from "./run";

describe("runAes", () => {
  beforeEach(() => {
    aesEncrypt.mockReset();
    aesDecrypt.mockReset();
  });

  it("returns null when input is empty", () => {
    expect(runAes("", "pw", "encrypt")).toBeNull();
  });

  it("returns null when password is empty", () => {
    expect(runAes("secret", "", "encrypt")).toBeNull();
  });

  it("encrypts and decrypts by mode", () => {
    aesEncrypt.mockReturnValue(Promise.resolve("cipher"));
    runAes("plain", "pw", "encrypt");
    expect(aesEncrypt).toHaveBeenCalledWith("plain", "pw");

    aesDecrypt.mockReturnValue(Promise.resolve("plain"));
    runAes("cipher", "pw", "decrypt");
    expect(aesDecrypt).toHaveBeenCalledWith("cipher", "pw");
  });
});
