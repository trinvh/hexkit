import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

const invokeSpy = vi.fn();
let invokeImpl: (...args: unknown[]) => Promise<unknown> = () =>
  Promise.resolve({ characters: 0, bytes: 0, words: 0, lines: 0 });
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

import { InspectorTool } from "./InspectorTool";

beforeEach(() => {
  invokeSpy.mockReset();
  invokeImpl = () => Promise.resolve({ characters: 0, bytes: 0, words: 0, lines: 0 });
});

describe("InspectorTool", () => {
  it("shows statistics for the input", async () => {
    invokeImpl = () =>
      Promise.resolve({ characters: 12, bytes: 13, words: 7, lines: 3 });
    render(<InspectorTool />);
    fireEvent.change(screen.getByLabelText("Text to inspect"), {
      target: { value: "hello world" },
    });
    await waitFor(() => expect(screen.getByText("13")).toBeInTheDocument());
    expect(screen.getByText("Characters")).toBeInTheDocument();
    expect(invokeSpy).toHaveBeenCalledWith(
      "run_action",
      expect.objectContaining({ action: "string.inspect" }),
    );
  });
});
