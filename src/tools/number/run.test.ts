import { describe, it, expect, vi, beforeEach } from "vitest";

const numberAll = vi.fn();
vi.mock("./api", () => ({
  numberAll: (...args: unknown[]) => numberAll(...args),
}));

import { runAll, NUMBER_BASES } from "./run";

describe("runAll", () => {
  beforeEach(() => numberAll.mockReset());

  it("returns null for blank input", () => {
    expect(runAll("  ", 10, 36)).toBeNull();
    expect(numberAll).not.toHaveBeenCalled();
  });

  it("calls the backend with value, base, and custom base", () => {
    numberAll.mockReturnValue(Promise.resolve({}));
    runAll("ff", 16, 36);
    expect(numberAll).toHaveBeenCalledWith("ff", 16, 36);
  });
});

describe("NUMBER_BASES", () => {
  it("covers every base from 2 to 36", () => {
    expect(NUMBER_BASES).toHaveLength(35);
    expect(NUMBER_BASES[0].value).toBe("2");
    expect(NUMBER_BASES[NUMBER_BASES.length - 1].value).toBe("36");
    expect(NUMBER_BASES.find((b) => b.value === "16")?.label).toContain("Hex");
  });
});
