import { describe, it, expect, vi, beforeEach } from "vitest";

const pgpSign = vi.fn();
vi.mock("./api", () => ({
  pgpSign: (...args: unknown[]) => pgpSign(...args),
}));

import { runSign } from "./run";

describe("runSign", () => {
  beforeEach(() => pgpSign.mockReset());

  it("requires both data and a key", () => {
    expect(runSign("", "key", "")).toBeNull();
    expect(runSign("data", " ", "")).toBeNull();
    expect(pgpSign).not.toHaveBeenCalled();
  });

  it("passes through to backend with passphrase", () => {
    pgpSign.mockReturnValue(Promise.resolve("sig"));
    runSign("hello", "PRIV", "pw");
    expect(pgpSign).toHaveBeenCalledWith("hello", "PRIV", "pw");
  });
});
