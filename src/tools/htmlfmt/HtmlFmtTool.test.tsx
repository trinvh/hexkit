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

import { HtmlFmtTool } from "./HtmlFmtTool";

beforeEach(() => {
  invokeSpy.mockReset();
  invokeImpl = () => Promise.resolve("");
});

describe("HtmlFmtTool", () => {
  it("beautifies HTML by default", async () => {
    invokeImpl = () => Promise.resolve("<div>\n  <p>hi</p>\n</div>");
    render(<HtmlFmtTool />);
    fireEvent.change(screen.getByLabelText("HTML input"), {
      target: { value: "<div><p>hi</p></div>" },
    });
    const out = screen.getByLabelText("HTML output") as HTMLTextAreaElement;
    await waitFor(() => expect(out.value).toContain("<p>hi</p>"));
    expect(invokeSpy).toHaveBeenCalledWith(
      "run_action",
      expect.objectContaining({ action: "htmlfmt.beautify" }),
    );
  });
});
