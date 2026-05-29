import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

const invokeSpy = vi.fn();
let invokeImpl: (...args: unknown[]) => Promise<unknown> = () =>
  Promise.resolve([]);
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
  }: {
    value: string;
    onChange?: (value: string) => void;
    ariaLabel?: string;
  }) => (
    <textarea
      aria-label={ariaLabel}
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
    />
  ),
}));

import { DiffTool } from "./DiffTool";

beforeEach(() => {
  invokeSpy.mockReset();
  invokeImpl = () => Promise.resolve([]);
});

describe("DiffTool", () => {
  it("renders inserted and deleted lines", async () => {
    invokeImpl = () =>
      Promise.resolve([
        { tag: "equal", value: "a" },
        { tag: "delete", value: "bbb" },
        { tag: "insert", value: "xyz" },
      ]);
    render(<DiffTool />);
    fireEvent.change(screen.getByLabelText("Original text"), {
      target: { value: "a\nbbb" },
    });
    fireEvent.change(screen.getByLabelText("Changed text"), {
      target: { value: "a\nxyz" },
    });
    expect(await screen.findByText("xyz")).toBeInTheDocument();
    expect(screen.getByText("bbb")).toBeInTheDocument();
    expect(invokeSpy).toHaveBeenCalledWith(
      "run_action",
      expect.objectContaining({ action: "diff.compare" }),
    );
  });
});
