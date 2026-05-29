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

import { SvgTool } from "./SvgTool";

beforeEach(() => {
  invokeSpy.mockReset();
  invokeImpl = () => Promise.resolve("");
});

describe("SvgTool", () => {
  it("wraps SVG as a CSS data URI", async () => {
    invokeImpl = () =>
      Promise.resolve('background-image: url("data:image/svg+xml;base64,PHN2Zz4=");');
    render(<SvgTool />);
    fireEvent.change(screen.getByLabelText("SVG input"), {
      target: { value: "<svg></svg>" },
    });
    const out = screen.getByLabelText("CSS output") as HTMLTextAreaElement;
    await waitFor(() => expect(out.value).toContain("data:image/svg+xml"));
    expect(invokeSpy).toHaveBeenCalledWith(
      "run_action",
      expect.objectContaining({ action: "svg.to_css" }),
    );
  });
});
