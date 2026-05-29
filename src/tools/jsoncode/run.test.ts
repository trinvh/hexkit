import { describe, it, expect, vi, beforeEach } from "vitest";

const jsonToCode = vi.fn();
vi.mock("./api", () => ({
  jsonToCode: (...a: unknown[]) => jsonToCode(...a),
}));

import { runJsonCode } from "./run";

describe("runJsonCode", () => {
  beforeEach(() => jsonToCode.mockReset());

  it("returns null for blank input", () => {
    expect(runJsonCode("  ", "typescript")).toBeNull();
  });

  it("generates code for the chosen target", () => {
    jsonToCode.mockReturnValue(Promise.resolve(""));
    runJsonCode('{"a":1}', "go");
    expect(jsonToCode).toHaveBeenCalledWith('{"a":1}', "go");
  });
});
