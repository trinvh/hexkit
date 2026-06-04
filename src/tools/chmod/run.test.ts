import { describe, it, expect, vi, beforeEach } from "vitest";

const invokeSpy = vi.fn();
let invokeImpl: (...args: unknown[]) => Promise<unknown> = () =>
  Promise.resolve(null);
vi.mock("@tauri-apps/api/core", () => ({
  invoke: (...args: unknown[]) => {
    invokeSpy(...args);
    return invokeImpl(...args);
  },
}));

import { runChmod } from "./run";

beforeEach(() => {
  invokeSpy.mockReset();
  invokeImpl = () => Promise.resolve(null);
});

describe("runChmod", () => {
  it("returns null for empty input", () => {
    expect(runChmod("")).toBeNull();
    expect(runChmod("   ")).toBeNull();
  });

  it("dispatches chmod.describe for a non-empty mode", () => {
    runChmod("755");
    expect(invokeSpy).toHaveBeenCalledWith(
      "run_action",
      expect.objectContaining({ action: "chmod.describe" }),
    );
  });
});
