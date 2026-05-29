import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";

const invokeSpy = vi.fn();
let invokeImpl: (...args: unknown[]) => Promise<unknown> = () =>
  Promise.resolve("");
vi.mock("@tauri-apps/api/core", () => ({
  invoke: (...args: unknown[]) => {
    invokeSpy(...args);
    return invokeImpl(...args);
  },
}));
vi.mock("../../components/ui/CodeEditor", () => ({
  CodeEditor: ({ value, ariaLabel }: { value: string; ariaLabel?: string }) => (
    <textarea aria-label={ariaLabel} readOnly value={value} />
  ),
}));

import { LoremTool } from "./LoremTool";

beforeEach(() => {
  invokeSpy.mockReset();
  invokeImpl = () => Promise.resolve("Lorem ipsum dolor sit amet.");
});

describe("LoremTool", () => {
  it("generates placeholder text on mount", async () => {
    render(<LoremTool />);
    const output = screen.getByLabelText(
      "Lorem ipsum output",
    ) as HTMLTextAreaElement;
    await waitFor(() =>
      expect(output.value).toBe("Lorem ipsum dolor sit amet."),
    );
    expect(invokeSpy).toHaveBeenCalledWith(
      "run_action",
      expect.objectContaining({ action: "lorem.generate" }),
    );
  });
});
