import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const invokeSpy = vi.fn();
let invokeImpl: (...args: unknown[]) => Promise<unknown> = () =>
  Promise.resolve("");
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

import { LinesTool } from "./LinesTool";

beforeEach(() => {
  invokeSpy.mockReset();
  invokeImpl = () => Promise.resolve("a\nb");
});

describe("LinesTool", () => {
  it("processes lines and reflects option toggles", async () => {
    render(<LinesTool />);
    fireEvent.change(screen.getByLabelText("Lines input"), {
      target: { value: "b\na\nb" },
    });
    const output = screen.getByLabelText("Lines output") as HTMLTextAreaElement;
    await waitFor(() => expect(output.value).toBe("a\nb"));

    const user = userEvent.setup();
    const dedupe = screen.getByRole("button", { name: "Dedupe" });
    expect(dedupe).toHaveAttribute("aria-pressed", "false");
    await user.click(dedupe);
    expect(dedupe).toHaveAttribute("aria-pressed", "true");

    await waitFor(() =>
      expect(invokeSpy).toHaveBeenCalledWith(
        "run_action",
        expect.objectContaining({ action: "lines.process" }),
      ),
    );
  });
});
