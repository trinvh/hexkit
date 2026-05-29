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

import { XmlTool } from "./XmlTool";

beforeEach(() => {
  invokeSpy.mockReset();
  invokeImpl = () => Promise.resolve("");
});

describe("XmlTool", () => {
  it("beautifies XML by default", async () => {
    invokeImpl = () => Promise.resolve("<a>\n  <b>x</b>\n</a>");
    render(<XmlTool />);
    fireEvent.change(screen.getByLabelText("XML input"), {
      target: { value: "<a><b>x</b></a>" },
    });
    const out = screen.getByLabelText("XML output") as HTMLTextAreaElement;
    await waitFor(() => expect(out.value).toContain("<b>x</b>"));
    expect(invokeSpy).toHaveBeenCalledWith(
      "run_action",
      expect.objectContaining({ action: "xml.beautify" }),
    );
  });
});
