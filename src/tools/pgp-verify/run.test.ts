import { describe, it, expect, vi, beforeEach } from "vitest";

const pgpVerify = vi.fn();
vi.mock("./api", () => ({
  pgpVerify: (...args: unknown[]) => pgpVerify(...args),
}));

import { runVerify } from "./run";

describe("runVerify", () => {
  beforeEach(() => pgpVerify.mockReset());

  it("returns null until all three fields are filled", () => {
    expect(runVerify("", "sig", "key")).toBeNull();
    expect(runVerify("d", " ", "key")).toBeNull();
    expect(runVerify("d", "sig", " ")).toBeNull();
    expect(pgpVerify).not.toHaveBeenCalled();
  });

  it("forwards all three to backend", () => {
    pgpVerify.mockReturnValue(Promise.resolve({}));
    runVerify("d", "sig", "key");
    expect(pgpVerify).toHaveBeenCalledWith("d", "sig", "key");
  });
});
