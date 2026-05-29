import { describe, it, expect, vi, beforeEach } from "vitest";

const idInspect = vi.fn();
vi.mock("./api", () => ({
  idInspect: (...args: unknown[]) => idInspect(...args),
  idGenerate: vi.fn(),
}));

import { runInspect, ID_KINDS } from "./run";

describe("runInspect", () => {
  beforeEach(() => idInspect.mockReset());

  it("returns null for blank input", () => {
    expect(runInspect("  ")).toBeNull();
    expect(idInspect).not.toHaveBeenCalled();
  });

  it("inspects a non-empty value", () => {
    idInspect.mockReturnValue(Promise.resolve({ kind: "UUID", detail: "" }));
    runInspect("abc");
    expect(idInspect).toHaveBeenCalledWith("abc");
  });

  it("offers uuid and ulid kinds", () => {
    expect(ID_KINDS.map((k) => k.value)).toEqual(["uuid_v4", "uuid_v7", "ulid"]);
  });
});
