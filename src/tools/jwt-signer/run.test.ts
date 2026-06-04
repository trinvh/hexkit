import { describe, it, expect, vi, beforeEach } from "vitest";

const jwtSign = vi.fn();
vi.mock("./api", () => ({
  jwtSign: (...args: unknown[]) => jwtSign(...args),
}));

import { runSign } from "./run";

describe("runSign", () => {
  beforeEach(() => jwtSign.mockReset());

  it("returns null when the payload is blank", () => {
    expect(runSign("  ", "secret", "HS256")).toBeNull();
    expect(jwtSign).not.toHaveBeenCalled();
  });

  it("returns null when the secret is empty", () => {
    expect(runSign('{"a":1}', "", "HS256")).toBeNull();
    expect(jwtSign).not.toHaveBeenCalled();
  });

  it("signs the parsed payload when both are present", () => {
    jwtSign.mockReturnValue(Promise.resolve("token"));
    runSign('{"sub":"42"}', "topsecret", "HS512");
    expect(jwtSign).toHaveBeenCalledWith({ sub: "42" }, "topsecret", "HS512");
  });

  it("rejects when the payload is not valid JSON", async () => {
    await expect(runSign("not json", "secret", "HS256")).rejects.toThrow(
      /not valid JSON/,
    );
    expect(jwtSign).not.toHaveBeenCalled();
  });
});
