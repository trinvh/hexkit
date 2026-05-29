import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

const invokeSpy = vi.fn();
let invokeImpl: (...args: unknown[]) => Promise<unknown> = () =>
  Promise.resolve(null);
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

import { JwtTool } from "./JwtTool";

beforeEach(() => {
  invokeSpy.mockReset();
  invokeImpl = () => Promise.resolve(null);
});

describe("JwtTool", () => {
  it("shows decoded sections", async () => {
    invokeImpl = () =>
      Promise.resolve({
        header: '{\n  "alg": "HS256"\n}',
        payload: '{\n  "name": "John Doe"\n}',
        signature: "sigvalue",
      });
    render(<JwtTool />);
    fireEvent.change(screen.getByLabelText("JWT token"), {
      target: { value: "a.b.c" },
    });
    expect(await screen.findByText("Header")).toBeInTheDocument();
    expect(screen.getByText("Payload")).toBeInTheDocument();
    expect(screen.getByText("sigvalue")).toBeInTheDocument();
  });

  it("verifies the signature when a secret is provided", async () => {
    invokeImpl = (...args: unknown[]) => {
      const action = (args[1] as { action: string }).action;
      if (action === "jwt.verify") {
        return Promise.resolve({ valid: true, algorithm: "HS256", reason: null });
      }
      return Promise.resolve({
        header: '{\n  "alg": "HS256"\n}',
        payload: '{\n  "iat": 1516239022\n}',
        signature: "sig",
      });
    };
    render(<JwtTool />);
    fireEvent.change(screen.getByLabelText("JWT token"), {
      target: { value: "a.b.c" },
    });
    fireEvent.change(screen.getByLabelText("HMAC secret"), {
      target: { value: "your-256-bit-secret" },
    });
    expect(await screen.findByText(/Signature verified/)).toBeInTheDocument();
    // The humanized iat claim is surfaced.
    expect(screen.getByText("Issued at")).toBeInTheDocument();
  });

  it("shows an error for an invalid token", async () => {
    invokeImpl = () =>
      Promise.reject({
        kind: "invalid_input",
        message: "a JWT must have three dot-separated parts",
      });
    render(<JwtTool />);
    fireEvent.change(screen.getByLabelText("JWT token"), {
      target: { value: "broken" },
    });
    expect(await screen.findByText("Invalid token")).toBeInTheDocument();
  });
});
