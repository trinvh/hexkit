import { describe, it, expect, vi, beforeEach } from "vitest";

const invokeSpy = vi.fn();
let invokeImpl: (...a: unknown[]) => Promise<unknown> = () => Promise.resolve("");
vi.mock("@tauri-apps/api/core", () => ({
  invoke: (...a: unknown[]) => {
    invokeSpy(...a);
    return invokeImpl(...a);
  },
}));

import { runHtmlMarkdown } from "./run";

beforeEach(() => {
  invokeSpy.mockReset();
  invokeImpl = () => Promise.resolve("");
});

describe("runHtmlMarkdown", () => {
  it("returns null for empty input without calling the backend", () => {
    expect(runHtmlMarkdown("")).toBeNull();
    expect(invokeSpy).not.toHaveBeenCalled();
  });

  it("converts HTML to Markdown via the backend", async () => {
    invokeImpl = () => Promise.resolve("# Hello");
    const result = await runHtmlMarkdown("<h1>Hello</h1>");
    expect(result).toBe("# Hello");
    expect(invokeSpy).toHaveBeenCalledWith(
      "run_action",
      expect.objectContaining({ action: "htmlmd.convert" }),
    );
  });
});
