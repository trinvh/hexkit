import { describe, it, expect, vi, beforeEach } from "vitest";

// `invokeSpy` records call args; `invokeImpl` produces the (resolved/rejected)
// result. Returning the rejected promise from a plain function — rather than
// from the spy itself — avoids Vitest flagging the spy's tracked result as an
// unhandled rejection.
const invokeSpy = vi.fn();
let invokeImpl: (...args: unknown[]) => Promise<unknown> = () =>
  Promise.resolve(undefined);

vi.mock("@tauri-apps/api/core", () => ({
  invoke: (...args: unknown[]) => {
    invokeSpy(...args);
    return invokeImpl(...args);
  },
}));

import { runAction, isToolError, errorMessage } from "./ipc";

beforeEach(() => {
  invokeSpy.mockReset();
  invokeImpl = () => Promise.resolve(undefined);
});

describe("runAction", () => {
  it("invokes run_action with the action id and params", async () => {
    invokeImpl = () => Promise.resolve("ok");
    const result = await runAction<string>("json.minify", { input: "{}" });
    expect(result).toBe("ok");
    expect(invokeSpy).toHaveBeenCalledWith("run_action", {
      action: "json.minify",
      params: { input: "{}" },
    });
  });

  it("propagates a rejected ToolError unchanged", async () => {
    const toolError = { kind: "invalid_input", message: "bad" };
    invokeImpl = () => Promise.reject(toolError);
    await expect(runAction("json.format", {})).rejects.toEqual(toolError);
  });
});

describe("isToolError", () => {
  it("recognises tool errors", () => {
    expect(isToolError({ kind: "invalid_input", message: "x" })).toBe(true);
  });

  it("rejects non-tool-error shapes", () => {
    expect(isToolError(null)).toBe(false);
    expect(isToolError({ message: 42 })).toBe(false);
    expect(isToolError("nope")).toBe(false);
  });
});

describe("errorMessage", () => {
  it("reads the message from each error shape", () => {
    expect(errorMessage({ kind: "k", message: "tool" })).toBe("tool");
    expect(errorMessage(new Error("native"))).toBe("native");
    expect(errorMessage("plain")).toBe("plain");
  });
});
