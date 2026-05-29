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

import { NumberTool } from "./NumberTool";

beforeEach(() => {
  invokeSpy.mockReset();
  invokeImpl = () => Promise.resolve(null);
});

describe("NumberTool", () => {
  it("shows all base conversions for the input", async () => {
    invokeImpl = () =>
      Promise.resolve({
        decimal: "255",
        hexadecimal: "ff",
        binary: "11111111",
        octal: "377",
      });
    render(<NumberTool />);
    fireEvent.change(screen.getByLabelText("Number input"), {
      target: { value: "255" },
    });
    expect(await screen.findByText("11111111")).toBeInTheDocument();
    expect(invokeSpy).toHaveBeenCalledWith(
      "run_action",
      expect.objectContaining({ action: "number.convert" }),
    );
  });

  it("surfaces invalid-number errors", async () => {
    invokeImpl = () =>
      Promise.reject({ kind: "invalid_input", message: "not a valid base-10 number" });
    render(<NumberTool />);
    fireEvent.change(screen.getByLabelText("Number input"), {
      target: { value: "zz" },
    });
    expect(await screen.findByText("Invalid number")).toBeInTheDocument();
  });
});
