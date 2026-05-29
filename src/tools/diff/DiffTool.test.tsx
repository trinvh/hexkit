import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

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

  it("diffs as JSON with sort keys when selected", async () => {
    const user = userEvent.setup();
    render(<DiffTool />);
    await user.click(screen.getByRole("radio", { name: "JSON" }));
    await user.click(screen.getByRole("button", { name: "Sort keys" }));
    fireEvent.change(screen.getByLabelText("Original text"), {
      target: { value: '{"b":1,"a":2}' },
    });
    await waitFor(() =>
      expect(invokeSpy).toHaveBeenCalledWith(
        "run_action",
        expect.objectContaining({
          params: expect.objectContaining({ format: "json", sort: true }),
        }),
      ),
    );
  });
});
