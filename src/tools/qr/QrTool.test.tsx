import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const invokeSpy = vi.fn();
let invokeImpl: (...a: unknown[]) => Promise<unknown> = () => Promise.resolve("");
vi.mock("@tauri-apps/api/core", () => ({
  invoke: (...a: unknown[]) => {
    invokeSpy(...a);
    return invokeImpl(...a);
  },
}));

import { QrTool } from "./QrTool";

beforeEach(() => {
  invokeSpy.mockReset();
  invokeImpl = () => Promise.resolve("");
});

describe("QrTool", () => {
  it("generates an SVG QR code from text", async () => {
    invokeImpl = () => Promise.resolve('<svg viewBox="0 0 10 10"><rect /></svg>');
    render(<QrTool />);
    fireEvent.change(screen.getByLabelText("QR content"), {
      target: { value: "https://hexkit.app" },
    });
    await waitFor(() =>
      expect(invokeSpy).toHaveBeenCalledWith(
        "run_action",
        expect.objectContaining({ action: "qr.generate" }),
      ),
    );
  });

  it("reads an uploaded image via the backend", async () => {
    invokeImpl = (_cmd, payload) =>
      Promise.resolve(
        (payload as { action: string }).action === "qr.read" ? "decoded!" : "",
      );
    const user = userEvent.setup();
    render(<QrTool />);
    const file = new File(["img"], "qr.png", { type: "image/png" });
    await user.upload(screen.getByLabelText("QR image"), file);
    await waitFor(() => expect(screen.getByText("decoded!")).toBeInTheDocument());
    expect(invokeSpy).toHaveBeenCalledWith(
      "run_action",
      expect.objectContaining({ action: "qr.read" }),
    );
  });
});
