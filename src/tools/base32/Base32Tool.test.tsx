import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

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

import { Base32Tool } from "./Base32Tool";

beforeEach(() => {
  invokeSpy.mockReset();
  invokeImpl = () => Promise.resolve("");
});

describe("Base32Tool", () => {
  it("encodes text to Base32 by default", async () => {
    invokeImpl = () => Promise.resolve("MZXW6===");
    render(<Base32Tool />);
    fireEvent.change(screen.getByLabelText("Base32 input"), {
      target: { value: "foo" },
    });
    const output = screen.getByLabelText("Base32 output") as HTMLTextAreaElement;
    await waitFor(() => expect(output.value).toBe("MZXW6==="));
    expect(invokeSpy).toHaveBeenCalledWith(
      "run_action",
      expect.objectContaining({ action: "base32.encode" }),
    );
  });

  it("switches to decode mode and calls base32.decode", async () => {
    invokeImpl = () => Promise.resolve("foo");
    render(<Base32Tool />);
    fireEvent.click(screen.getByRole("radio", { name: "Decode" }));
    fireEvent.change(screen.getByLabelText("Base32 input"), {
      target: { value: "MZXW6===" },
    });
    await waitFor(() =>
      expect(invokeSpy).toHaveBeenCalledWith(
        "run_action",
        expect.objectContaining({ action: "base32.decode" }),
      ),
    );
  });
});
