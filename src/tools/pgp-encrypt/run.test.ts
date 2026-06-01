import { describe, it, expect, vi, beforeEach } from "vitest";

const pgpEncrypt = vi.fn();
vi.mock("./api", () => ({
  pgpEncrypt: (...args: unknown[]) => pgpEncrypt(...args),
}));

import { runEncrypt } from "./run";

describe("runEncrypt", () => {
  beforeEach(() => pgpEncrypt.mockReset());

  it("returns null if either field is empty", () => {
    expect(runEncrypt("", "key")).toBeNull();
    expect(runEncrypt("text", " ")).toBeNull();
    expect(pgpEncrypt).not.toHaveBeenCalled();
  });

  it("forwards both inputs to the backend", () => {
    pgpEncrypt.mockReturnValue(Promise.resolve("..."));
    runEncrypt("hi", "PUB");
    expect(pgpEncrypt).toHaveBeenCalledWith("hi", "PUB");
  });
});
