import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const invoke = vi.fn((..._args: unknown[]) => Promise.resolve());
vi.mock("@tauri-apps/api/core", () => ({
  invoke: (...args: unknown[]) => invoke(...args),
}));

const save = vi.fn();
vi.mock("@tauri-apps/plugin-dialog", () => ({
  save: (...args: unknown[]) => save(...args),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

import { downloadText } from "./download";

describe("downloadText (browser fallback)", () => {
  const createObjectURL = vi.fn((_blob: Blob) => "blob:mock");
  const revokeObjectURL = vi.fn();
  let clickSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    createObjectURL.mockClear();
    revokeObjectURL.mockClear();
    Object.defineProperty(URL, "createObjectURL", {
      value: createObjectURL,
      configurable: true,
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      value: revokeObjectURL,
      configurable: true,
    });
    clickSpy = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => {});
  });

  afterEach(() => {
    clickSpy.mockRestore();
  });

  it("creates a download anchor, clicks it, and cleans up", async () => {
    await downloadText("output.txt", "hello world");

    expect(createObjectURL).toHaveBeenCalledTimes(1);
    const blob = createObjectURL.mock.calls[0][0];
    expect(blob).toBeInstanceOf(Blob);
    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:mock");
    expect(document.querySelector("a[download]")).toBeNull();
  });

  it("uses the provided filename and mime type", async () => {
    await downloadText("data.json", "{}", "application/json");
    const blob = createObjectURL.mock.calls[0][0];
    expect(blob.type).toBe("application/json");
  });
});

describe("downloadText (Tauri save dialog)", () => {
  beforeEach(() => {
    invoke.mockClear();
    save.mockReset();
    (window as unknown as { __TAURI_INTERNALS__?: object }).__TAURI_INTERNALS__ =
      {};
  });

  afterEach(() => {
    delete (window as unknown as { __TAURI_INTERNALS__?: object })
      .__TAURI_INTERNALS__;
  });

  it("prompts for a path and writes via the save_file command", async () => {
    save.mockResolvedValue("/Users/me/result.txt");
    await downloadText("result.txt", "payload");

    expect(save).toHaveBeenCalledWith({ defaultPath: "result.txt" });
    expect(invoke).toHaveBeenCalledWith("save_file", {
      path: "/Users/me/result.txt",
      contents: "payload",
    });
  });

  it("does nothing when the user cancels the dialog", async () => {
    save.mockResolvedValue(null);
    await downloadText("result.txt", "payload");

    expect(invoke).not.toHaveBeenCalled();
  });
});
