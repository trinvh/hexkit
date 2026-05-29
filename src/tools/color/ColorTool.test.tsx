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
  it("shows hex, rgb, and hsl for a color", async () => {
    invokeImpl = () =>
      Promise.resolve({
        hex: "#ff0000",
        rgb: "rgb(255, 0, 0)",
        hsl: "hsl(0, 100%, 50%)",
      });
    render(<ColorTool />);
    fireEvent.change(screen.getByLabelText("Color value"), {
      target: { value: "red" },
    });
    await waitFor(() => expect(screen.getByText("#ff0000")).toBeInTheDocument());
    expect(screen.getByText("rgb(255, 0, 0)")).toBeInTheDocument();
    expect(invokeSpy).toHaveBeenCalledWith(
      "run_action",
      expect.objectContaining({ action: "color.convert" }),
    );
  });
});
