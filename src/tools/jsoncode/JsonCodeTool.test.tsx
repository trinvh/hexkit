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

import { JsonCodeTool } from "./JsonCodeTool";

beforeEach(() => {
  invokeSpy.mockReset();
  invokeImpl = () => Promise.resolve("");
});

describe("JsonCodeTool", () => {
  it("generates types from JSON", async () => {
    invokeImpl = () => Promise.resolve("interface Root {\n  a: number;\n}");
    render(<JsonCodeTool />);
    fireEvent.change(screen.getByLabelText("JSON input"), {
      target: { value: '{"a":1}' },
    });
    const out = screen.getByLabelText("Generated types") as HTMLTextAreaElement;
    await waitFor(() => expect(out.value).toContain("interface Root"));
    expect(invokeSpy).toHaveBeenCalledWith(
      "run_action",
      expect.objectContaining({ action: "jsoncode.generate" }),
    );
  });
});
