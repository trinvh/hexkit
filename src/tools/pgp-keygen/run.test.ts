import { describe, it, expect, vi, beforeEach } from "vitest";

const pgpKeygen = vi.fn();
vi.mock("./api", () => ({
  pgpKeygen: (...args: unknown[]) => pgpKeygen(...args),
}));

import { runKeygen } from "./run";

describe("runKeygen", () => {
  beforeEach(() => pgpKeygen.mockReset());

  it("returns null when user id is blank", () => {
    expect(runKeygen("  ", "")).toBeNull();
    expect(pgpKeygen).not.toHaveBeenCalled();
  });

  it("forwards user id and passphrase to the backend", () => {
    pgpKeygen.mockReturnValue(Promise.resolve({}));
    runKeygen("Alice <alice@example.com>", "swordfish");
    expect(pgpKeygen).toHaveBeenCalledWith("Alice <alice@example.com>", "swordfish");
  });
});
