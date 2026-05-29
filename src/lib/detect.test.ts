import { describe, it, expect, vi } from "vitest";
import { runSmartDetect, type SmartDetectDeps } from "./detect";

function makeDeps(overrides: Partial<SmartDetectDeps> = {}) {
  const open = vi.fn();
  const notify = vi.fn();
  const deps: SmartDetectDeps = {
    readClipboard: async () => "1700000000",
    detect: async () => ({ kind: "unix_time" }),
    resolveTool: () => "unix-time",
    open,
    notify,
    ...overrides,
  };
  return { deps, open, notify };
}

describe("runSmartDetect", () => {
  it("opens the matched tool with the clipboard value", async () => {
    const { deps, open, notify } = makeDeps();
    await runSmartDetect(deps);
    expect(open).toHaveBeenCalledWith("unix-time", "1700000000", undefined);
    expect(notify).not.toHaveBeenCalled();
  });

  it("forwards the mode hint", async () => {
    const { deps, open } = makeDeps({
      readClipboard: async () => "aGk=",
      detect: async () => ({ kind: "base64", mode: "decode" }),
      resolveTool: () => "base64-string",
    });
    await runSmartDetect(deps);
    expect(open).toHaveBeenCalledWith("base64-string", "aGk=", "decode");
  });

  it("notifies on an empty clipboard", async () => {
    const { deps, open, notify } = makeDeps({ readClipboard: async () => "  " });
    await runSmartDetect(deps);
    expect(notify).toHaveBeenCalledWith("Clipboard is empty");
    expect(open).not.toHaveBeenCalled();
  });

  it("notifies when nothing is detected", async () => {
    const { deps, notify } = makeDeps({ detect: async () => null });
    await runSmartDetect(deps);
    expect(notify).toHaveBeenCalledWith("No tool matched the clipboard");
  });

  it("notifies when the detected kind has no tool", async () => {
    const { deps, notify } = makeDeps({ resolveTool: () => undefined });
    await runSmartDetect(deps);
    expect(notify).toHaveBeenCalledWith("No tool matched the clipboard");
  });

  it("handles clipboard read failures", async () => {
    const { deps, notify } = makeDeps({
      readClipboard: async () => {
        throw new Error("denied");
      },
    });
    await runSmartDetect(deps);
    expect(notify).toHaveBeenCalledWith("Couldn't read the clipboard");
  });

  it("handles detection failures", async () => {
    const { deps, notify } = makeDeps({
      detect: async () => {
        throw new Error("boom");
      },
    });
    await runSmartDetect(deps);
    expect(notify).toHaveBeenCalledWith("Detection failed");
  });
});
