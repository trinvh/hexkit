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

import { CsvTool } from "./CsvTool";

beforeEach(() => {
  invokeSpy.mockReset();
  invokeImpl = () => Promise.resolve("");
});

describe("CsvTool", () => {
  it("converts CSV to JSON", async () => {
    invokeImpl = () => Promise.resolve('[{"a":"1"}]');
    render(<CsvTool />);
    fireEvent.change(screen.getByLabelText("CSV input"), {
      target: { value: "a\n1" },
    });
    const out = screen.getByLabelText("CSV output") as HTMLTextAreaElement;
    await waitFor(() => expect(out.value).toBe('[{"a":"1"}]'));
    expect(invokeSpy).toHaveBeenCalledWith(
      "run_action",
      expect.objectContaining({ action: "csv.to_json" }),
    );
  });
});
