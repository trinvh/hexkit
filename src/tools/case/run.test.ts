import { describe, it, expect, vi, beforeEach } from "vitest";

const caseConvert = vi.fn();
vi.mock("./api", () => ({
  caseConvert: (...args: unknown[]) => caseConvert(...args),
}));

import { runCase, CASE_ROWS } from "./run";

describe("runCase", () => {
  beforeEach(() => caseConvert.mockReset());

  it("returns null for blank input", () => {
    expect(runCase("   ")).toBeNull();
    expect(caseConvert).not.toHaveBeenCalled();
  });

  it("calls the backend with the text", () => {
    caseConvert.mockReturnValue(Promise.resolve({}));
    runCase("hello world");
    expect(caseConvert).toHaveBeenCalledWith("hello world");
  });

  it("lists every case style", () => {
    expect(CASE_ROWS.map((row) => row.key)).toContain("snake");
    expect(CASE_ROWS).toHaveLength(9);
  });
});
