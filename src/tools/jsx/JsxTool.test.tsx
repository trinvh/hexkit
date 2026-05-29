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

import { JsxTool } from "./JsxTool";

beforeEach(() => {
  invokeSpy.mockReset();
  invokeImpl = () => Promise.resolve("");
});

describe("JsxTool", () => {
  it("converts HTML attributes to JSX", async () => {
    invokeImpl = () => Promise.resolve('<div className="a">');
    render(<JsxTool />);
    fireEvent.change(screen.getByLabelText("HTML input"), {
      target: { value: '<div class="a">' },
    });
    const out = screen.getByLabelText("JSX output") as HTMLTextAreaElement;
    await waitFor(() => expect(out.value).toBe('<div className="a">'));
    expect(invokeSpy).toHaveBeenCalledWith(
      "run_action",
      expect.objectContaining({ action: "jsx.from_html" }),
    );
  });
});
