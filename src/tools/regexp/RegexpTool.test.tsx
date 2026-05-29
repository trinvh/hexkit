import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

const invokeSpy = vi.fn();
let invokeImpl: (...a: unknown[]) => Promise<unknown> = () =>
  Promise.resolve({ matches: [] });
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

import { RegexpTool } from "./RegexpTool";

beforeEach(() => {
  invokeSpy.mockReset();
  invokeImpl = () => Promise.resolve({ matches: [] });
});

describe("RegexpTool", () => {
  it("shows matches for a pattern", async () => {
    invokeImpl = () =>
      Promise.resolve({ matches: [{ value: "42", index: 3, groups: [] }] });
    render(<RegexpTool />);
    fireEvent.change(screen.getByLabelText("Regular expression"), {
      target: { value: "\\d+" },
    });
    fireEvent.change(screen.getByLabelText("Test text"), {
      target: { value: "abc42" },
    });
    await waitFor(() => expect(screen.getByText("42")).toBeInTheDocument());
    expect(screen.getByText("at 3")).toBeInTheDocument();
    expect(invokeSpy).toHaveBeenCalledWith(
      "run_action",
      expect.objectContaining({ action: "regexp.test" }),
    );
  });
});
