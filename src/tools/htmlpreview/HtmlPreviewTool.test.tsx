import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

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

import { HtmlPreviewTool } from "./HtmlPreviewTool";

describe("HtmlPreviewTool", () => {
  it("mirrors the HTML source into a sandboxed preview frame", () => {
    render(<HtmlPreviewTool />);
    const frame = screen.getByTitle("HTML preview") as HTMLIFrameElement;
    expect(frame).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("HTML source"), {
      target: { value: "<h1>Hi</h1>" },
    });
    expect(frame).toHaveAttribute("srcdoc", "<h1>Hi</h1>");
  });
});
