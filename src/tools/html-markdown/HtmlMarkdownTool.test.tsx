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
    readOnly,
  }: {
    value: string;
    onChange?: (v: string) => void;
    ariaLabel?: string;
    readOnly?: boolean;
  }) => (
    <textarea
      aria-label={ariaLabel}
      readOnly={readOnly}
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
    />
  ),
}));

import { HtmlMarkdownTool } from "./HtmlMarkdownTool";

beforeEach(() => {
  invokeSpy.mockReset();
  invokeImpl = () => Promise.resolve("");
});

describe("HtmlMarkdownTool", () => {
  it("converts a heading, link, and list to Markdown", async () => {
    invokeImpl = () =>
      Promise.resolve("# Hexkit\n\n[site](https://hexkit.app)\n\n* Fast\n* Private");
    render(<HtmlMarkdownTool />);
    fireEvent.change(screen.getByLabelText("HTML input"), {
      target: {
        value:
          '<h1>Hexkit</h1><a href="https://hexkit.app">site</a><ul><li>Fast</li><li>Private</li></ul>',
      },
    });
    const out = screen.getByLabelText("Markdown output") as HTMLTextAreaElement;
    await waitFor(() => expect(out.value).toContain("# Hexkit"));
    expect(out.value).toContain("[site](https://hexkit.app)");
    expect(out.value).toContain("* Fast");
    expect(invokeSpy).toHaveBeenCalledWith(
      "run_action",
      expect.objectContaining({ action: "htmlmd.convert" }),
    );
  });
});
