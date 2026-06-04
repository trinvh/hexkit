import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

const invokeSpy = vi.fn();
let invokeImpl: (...a: unknown[]) => Promise<unknown> = () =>
  Promise.resolve("");
vi.mock("@tauri-apps/api/core", () => ({
  invoke: (...a: unknown[]) => {
    invokeSpy(...a);
    return invokeImpl(...a);
  },
}));

import { TotpTool } from "./TotpTool";

beforeEach(() => {
  invokeSpy.mockReset();
  invokeImpl = (_cmd, payload) => {
    const action = (payload as { action: string }).action;
    if (action === "totp.generate") {
      return Promise.resolve({ code: "287082", secondsRemaining: 1 });
    }
    if (action === "totp.uri") {
      return Promise.resolve("otpauth://totp/Hexkit:account?secret=ABC");
    }
    if (action === "qr.generate") {
      return Promise.resolve('<svg viewBox="0 0 10 10"><rect /></svg>');
    }
    return Promise.resolve("");
  };
});

describe("TotpTool", () => {
  it("generates a live code from the secret", async () => {
    render(<TotpTool />);
    fireEvent.change(screen.getByLabelText("Base32 secret"), {
      target: { value: "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ" },
    });
    await waitFor(() => {
      expect(invokeSpy).toHaveBeenCalledWith(
        "run_action",
        expect.objectContaining({ action: "totp.generate" }),
      );
    });
    await waitFor(() =>
      expect(screen.getByText("287082")).toBeInTheDocument(),
    );
    expect(screen.getByLabelText("Seconds remaining")).toHaveTextContent("1s");
  });

  it("builds an otpauth URI and renders it as a QR code", async () => {
    render(<TotpTool />);
    fireEvent.change(screen.getByLabelText("Base32 secret"), {
      target: { value: "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ" },
    });
    await waitFor(() => {
      expect(invokeSpy).toHaveBeenCalledWith(
        "run_action",
        expect.objectContaining({ action: "totp.uri" }),
      );
    });
    await waitFor(() => {
      expect(invokeSpy).toHaveBeenCalledWith(
        "run_action",
        expect.objectContaining({ action: "qr.generate" }),
      );
    });
    await waitFor(() =>
      expect(
        screen.getByText("otpauth://totp/Hexkit:account?secret=ABC"),
      ).toBeInTheDocument(),
    );
  });
});
