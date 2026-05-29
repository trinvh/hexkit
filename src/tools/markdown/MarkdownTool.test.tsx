import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

const invokeSpy = vi.fn();
let invokeImpl: (...a: unknown[]) => Promise<unknown> = () => Promise.resolve("");
vi.mock("@tauri-apps/api/core", () => ({
  invoke: (...a: unknown[]) => {
    invokeSpy(...a);
    return invokeImpl(...a);
  },
}));
vi.mock("../../components/ui/CodeEditor", () => ({
  CodeEditor: ({
    value,
    onChange,
    ariaLabel,
  }: {
    value: string;
    onChange?: (v: string) => void;
    ariaLabel?: string;
  }) => (
    <textarea
      aria-label={ariaLabel}
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
    />
  ),
}));

import { MarkdownTool } from "./MarkdownTool";

beforeEach(() => {
  invokeSpy.mockReset();
  invokeImpl = () => Promise.resolve("<h1>Hi</h1>");
});

describe("MarkdownTool", () => {
  it("renders markdown to a preview frame", async () => {
    render(<MarkdownTool />);
    expect(screen.getByTitle("Markdown preview")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Markdown input"), {
      target: { value: "# Hi" },
    });
    await waitFor(() =>
      expect(invokeSpy).toHaveBeenCalledWith(
        "run_action",
        expect.objectContaining({ action: "markdown.to_html" }),
      ),
    );
  });
});
