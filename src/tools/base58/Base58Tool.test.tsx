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

import { Base58Tool } from "./Base58Tool";

beforeEach(() => {
  invokeSpy.mockReset();
  invokeImpl = () => Promise.resolve("");
});

describe("Base58Tool", () => {
  it("encodes text via the backend", async () => {
    invokeImpl = () => Promise.resolve("Cn8eVZg");
    render(<Base58Tool />);
    fireEvent.change(screen.getByLabelText("Base58 input"), {
      target: { value: "hello" },
    });
    const output = screen.getByLabelText("Base58 output") as HTMLTextAreaElement;
    await waitFor(() => expect(output.value).toBe("Cn8eVZg"));
    expect(invokeSpy).toHaveBeenCalledWith(
      "run_action",
      expect.objectContaining({ action: "base58.encode" }),
    );
  });
});
