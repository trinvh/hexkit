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
