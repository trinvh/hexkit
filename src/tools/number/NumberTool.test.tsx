import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

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

const RESULT = {
  binary: "11111111",
  octal: "377",
  decimal: "255",
  hexadecimal: "ff",
  custom: "73",
};

const field = (label: string) =>
  screen.getByLabelText(label) as HTMLInputElement;

beforeEach(() => {
  invokeSpy.mockReset();
  invokeImpl = () => Promise.resolve(RESULT);
});

describe("NumberTool", () => {
  it("computes every base when one field is edited", async () => {
    render(<NumberTool />);
    fireEvent.change(field("Base 10 (Decimal)"), { target: { value: "255" } });

    await waitFor(() => expect(field("Base 2 (Binary)").value).toBe("11111111"));
    expect(field("Base 16 (Hex)").value).toBe("ff");
    expect(field("Select base:").value).toBe("73");
    // The edited field keeps the raw value the user typed.
    expect(field("Base 10 (Decimal)").value).toBe("255");
    expect(invokeSpy).toHaveBeenCalledWith(
      "run_action",
      expect.objectContaining({ action: "number.all" }),
    );
  });

  it("is bidirectional — editing hex reads in base 16", async () => {
    render(<NumberTool />);
    fireEvent.change(field("Base 16 (Hex)"), { target: { value: "ff" } });
    await waitFor(() => expect(field("Base 10 (Decimal)").value).toBe("255"));
    expect(invokeSpy).toHaveBeenCalledWith(
      "run_action",
      expect.objectContaining({ params: expect.objectContaining({ base: 16 }) }),
    );
  });

  it("loads the sample value", async () => {
    render(<NumberTool />);
    fireEvent.click(screen.getByRole("button", { name: "Sample" }));
    await waitFor(() =>
      expect(invokeSpy).toHaveBeenCalledWith(
        "run_action",
        expect.objectContaining({
          params: expect.objectContaining({ input: "621985836" }),
        }),
      ),
    );
  });
});
