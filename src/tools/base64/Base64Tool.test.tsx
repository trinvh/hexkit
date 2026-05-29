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
    onChange?: (value: string) => void;
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

import { Base64Tool } from "./Base64Tool";

beforeEach(() => {
  invokeSpy.mockReset();
  invokeImpl = () => Promise.resolve("");
});

describe("Base64Tool", () => {
  it("renders encode/decode controls, encode active by default", () => {
    render(<Base64Tool />);
    expect(screen.getByRole("radio", { name: "Encode" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    expect(screen.getByRole("radio", { name: "Decode" })).toHaveAttribute(
      "aria-checked",
      "false",
    );
  });

  it("encodes input through the backend", async () => {
    invokeImpl = () => Promise.resolve("aGVsbG8=");
    render(<Base64Tool />);

    fireEvent.change(screen.getByLabelText("Base64 input"), {
      target: { value: "hello" },
    });

    const output = screen.getByLabelText("Base64 output") as HTMLTextAreaElement;
    await waitFor(() => expect(output.value).toBe("aGVsbG8="));
    expect(invokeSpy).toHaveBeenCalledWith(
      "run_action",
      expect.objectContaining({ action: "base64.encode" }),
    );
  });

  it("switches to decode and calls the decode action", async () => {
    invokeImpl = () => Promise.resolve("hello");
    const user = userEvent.setup();
    render(<Base64Tool />);

    await user.click(screen.getByRole("radio", { name: "Decode" }));
    fireEvent.change(screen.getByLabelText("Base64 input"), {
      target: { value: "aGVsbG8=" },
    });

    await waitFor(() =>
      expect(invokeSpy).toHaveBeenCalledWith(
        "run_action",
        expect.objectContaining({ action: "base64.decode" }),
      ),
    );
  });

  it("shows an error banner when decoding fails", async () => {
    invokeImpl = () =>
      Promise.reject({ kind: "invalid_input", message: "Invalid byte" });
    const user = userEvent.setup();
    render(<Base64Tool />);

    await user.click(screen.getByRole("radio", { name: "Decode" }));
    fireEvent.change(screen.getByLabelText("Base64 input"), {
      target: { value: "@@@" },
    });

    expect(await screen.findByText("Invalid Base64")).toBeInTheDocument();
  });
});
