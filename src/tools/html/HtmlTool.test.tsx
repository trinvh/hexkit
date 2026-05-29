import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

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
  CodeEditor: ({
    value,
    onChange,
    ariaLabel,
    readOnly,
  }: {
    value: string;
    onChange?: (value: string) => void;
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

import { HtmlTool } from "./HtmlTool";

beforeEach(() => {
  invokeSpy.mockReset();
  invokeImpl = () => Promise.resolve("");
});

describe("HtmlTool", () => {
  it("escapes input through the html.encode action", async () => {
    invokeImpl = () => Promise.resolve("&lt;a&gt;");
    render(<HtmlTool />);
    fireEvent.change(screen.getByLabelText("HTML input"), {
      target: { value: "<a>" },
    });
    const output = screen.getByLabelText("HTML output") as HTMLTextAreaElement;
    await waitFor(() => expect(output.value).toBe("&lt;a&gt;"));
    expect(invokeSpy).toHaveBeenCalledWith(
      "run_action",
      expect.objectContaining({ action: "html.encode" }),
    );
  });
});
