import { describe, it, expect, vi, beforeEach } from "vitest";

const pgpEncryptSign = vi.fn();
vi.mock("./api", () => ({
  pgpEncryptSign: (...args: unknown[]) => pgpEncryptSign(...args),
}));

import { runEncryptSign } from "./run";

describe("runEncryptSign", () => {
  beforeEach(() => pgpEncryptSign.mockReset());

  it("returns null without all required inputs", () => {
    expect(runEncryptSign("", "pub", "priv", "")).toBeNull();
    expect(runEncryptSign("hi", " ", "priv", "")).toBeNull();
    expect(runEncryptSign("hi", "pub", " ", "")).toBeNull();
    expect(pgpEncryptSign).not.toHaveBeenCalled();
  });

  it("passes through to backend in correct order", () => {
    pgpEncryptSign.mockReturnValue(Promise.resolve("ct"));
    runEncryptSign("hi", "PUB", "PRIV", "pw");
    expect(pgpEncryptSign).toHaveBeenCalledWith("hi", "PUB", "PRIV", "pw");
  });
});
