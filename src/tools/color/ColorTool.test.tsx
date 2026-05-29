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

import { ColorTool } from "./ColorTool";

beforeEach(() => {
  invokeSpy.mockReset();
  invokeImpl = () => Promise.resolve(null);
});

describe("ColorTool", () => {
  const RED = {
    hex: "#ff0000",
    hex8: "#ff0000ff",
    rgb: "rgb(255, 0, 0)",
    rgba: "rgba(255, 0, 0, 1)",
    hsl: "hsl(0, 100%, 50%)",
    hsla: "hsla(0, 100%, 50%, 1)",
    hsb: "hsb(0, 100%, 100%)",
    hwb: "hwb(0 0% 0%)",
    cmyk: "cmyk(0%, 100%, 100%, 0%)",
  };

  it("shows every color format for a value", async () => {
    invokeImpl = () => Promise.resolve(RED);
    render(<ColorTool />);
    fireEvent.change(screen.getByLabelText("Color value"), {
      target: { value: "red" },
    });
    await waitFor(() => expect(screen.getByText("#ff0000")).toBeInTheDocument());
    expect(screen.getByText("rgb(255, 0, 0)")).toBeInTheDocument();
    expect(screen.getByText("cmyk(0%, 100%, 100%, 0%)")).toBeInTheDocument();
    expect(screen.getByText("hwb(0 0% 0%)")).toBeInTheDocument();
    expect(invokeSpy).toHaveBeenCalledWith(
      "run_action",
      expect.objectContaining({ action: "color.convert" }),
    );
  });

  it("updates the input from the color picker", async () => {
    invokeImpl = () => Promise.resolve(RED);
    render(<ColorTool />);
    fireEvent.input(screen.getByLabelText("Color picker"), {
      target: { value: "#00ff00" },
    });
    expect(
      (screen.getByLabelText("Color value") as HTMLInputElement).value,
    ).toBe("#00ff00");
  });
});
