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

import { PhpTool } from "./PhpTool";

beforeEach(() => {
  invokeSpy.mockReset();
  invokeImpl = () => Promise.resolve("");
});

describe("PhpTool", () => {
  it("unserializes PHP to JSON", async () => {
    invokeImpl = () => Promise.resolve('{\n  "a": 1\n}');
    render(<PhpTool />);
    fireEvent.change(screen.getByLabelText("PHP input"), {
      target: { value: 'a:1:{s:1:"a";i:1;}' },
    });
    const out = screen.getByLabelText("PHP output") as HTMLTextAreaElement;
    await waitFor(() => expect(out.value).toBe('{\n  "a": 1\n}'));
    expect(invokeSpy).toHaveBeenCalledWith(
      "run_action",
      expect.objectContaining({ action: "php.to_json" }),
    );
  });
});
