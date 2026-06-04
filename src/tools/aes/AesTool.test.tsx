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

import { AesTool } from "./AesTool";

beforeEach(() => {
  invokeSpy.mockReset();
  invokeImpl = () => Promise.resolve("");
});

describe("AesTool", () => {
  it("encrypts text with a password via the backend", async () => {
    invokeImpl = () => Promise.resolve("c2FsdG5vbmNlY2lwaGVy");
    render(<AesTool />);
    fireEvent.change(screen.getByLabelText("AES input"), {
      target: { value: "top secret" },
    });
    fireEvent.change(screen.getByLabelText("AES password"), {
      target: { value: "hunter2" },
    });
    await waitFor(() =>
      expect(invokeSpy).toHaveBeenCalledWith(
        "run_action",
        expect.objectContaining({
          action: "aes.encrypt",
          params: expect.objectContaining({
            plaintext: "top secret",
            password: "hunter2",
          }),
        }),
      ),
    );
  });

  it("decrypts ciphertext under the decrypt mode", async () => {
    invokeImpl = () => Promise.resolve("top secret");
    render(<AesTool />);
    fireEvent.click(screen.getByRole("radio", { name: "Decrypt" }));
    fireEvent.change(screen.getByLabelText("AES input"), {
      target: { value: "c2FsdG5vbmNlY2lwaGVy" },
    });
    fireEvent.change(screen.getByLabelText("AES password"), {
      target: { value: "hunter2" },
    });
    await waitFor(() =>
      expect(invokeSpy).toHaveBeenCalledWith(
        "run_action",
        expect.objectContaining({
          action: "aes.decrypt",
          params: expect.objectContaining({
            input: "c2FsdG5vbmNlY2lwaGVy",
            password: "hunter2",
          }),
        }),
      ),
    );
    expect(await screen.findByText("top secret")).toBeInTheDocument();
  });

  it("surfaces a decrypt error for a wrong password", async () => {
    invokeImpl = () =>
      Promise.reject(new Error("wrong password or tampered data"));
    render(<AesTool />);
    fireEvent.click(screen.getByRole("radio", { name: "Decrypt" }));
    fireEvent.change(screen.getByLabelText("AES input"), {
      target: { value: "c2FsdG5vbmNlY2lwaGVy" },
    });
    fireEvent.change(screen.getByLabelText("AES password"), {
      target: { value: "wrong" },
    });
    expect(await screen.findByText("Cannot decrypt")).toBeInTheDocument();
  });

  it("does not call the backend until a password is entered", async () => {
    render(<AesTool />);
    fireEvent.change(screen.getByLabelText("AES input"), {
      target: { value: "top secret" },
    });
    // Give the debounce a chance to fire; with no password there is no call.
    await new Promise((resolve) => setTimeout(resolve, 200));
    expect(invokeSpy).not.toHaveBeenCalled();
  });
});
