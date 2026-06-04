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

import { JwtSignerTool } from "./JwtSignerTool";

beforeEach(() => {
  invokeSpy.mockReset();
  invokeImpl = () => Promise.resolve("");
});

describe("JwtSignerTool", () => {
  it("signs a payload with a secret and shows the token", async () => {
    invokeImpl = () => Promise.resolve("header.payload.signature");
    render(<JwtSignerTool />);
    fireEvent.change(screen.getByLabelText("JWT payload"), {
      target: { value: '{"sub":"42"}' },
    });
    fireEvent.change(screen.getByLabelText("HMAC secret"), {
      target: { value: "topsecret" },
    });
    await waitFor(() =>
      expect(invokeSpy).toHaveBeenCalledWith(
        "run_action",
        expect.objectContaining({
          action: "jwt.sign",
          params: expect.objectContaining({
            payload: { sub: "42" },
            secret: "topsecret",
            algorithm: "HS256",
          }),
        }),
      ),
    );
    expect(
      await screen.findByText("header.payload.signature"),
    ).toBeInTheDocument();
  });

  it("changes the algorithm passed to the backend", async () => {
    invokeImpl = () => Promise.resolve("tok");
    render(<JwtSignerTool />);
    fireEvent.change(screen.getByLabelText("JWT payload"), {
      target: { value: "{}" },
    });
    fireEvent.change(screen.getByLabelText("HMAC secret"), {
      target: { value: "s" },
    });
    fireEvent.click(screen.getByRole("radio", { name: "HS512" }));
    await waitFor(() =>
      expect(invokeSpy).toHaveBeenCalledWith(
        "run_action",
        expect.objectContaining({
          params: expect.objectContaining({ algorithm: "HS512" }),
        }),
      ),
    );
  });

  it("shows an error when the payload is not valid JSON", async () => {
    render(<JwtSignerTool />);
    fireEvent.change(screen.getByLabelText("JWT payload"), {
      target: { value: "not json" },
    });
    fireEvent.change(screen.getByLabelText("HMAC secret"), {
      target: { value: "s" },
    });
    expect(await screen.findByText("Cannot sign")).toBeInTheDocument();
    expect(invokeSpy).not.toHaveBeenCalled();
  });
});
