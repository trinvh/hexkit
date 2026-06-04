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

import { PasswordHashTool } from "./PasswordHashTool";

beforeEach(() => {
  invokeSpy.mockReset();
  invokeImpl = () => Promise.resolve(null);
});

describe("PasswordHashTool", () => {
  it("hashes a password via pwhash.hash", async () => {
    invokeImpl = () => Promise.resolve({ hash: "$2b$12$abcdef" });
    render(<PasswordHashTool />);
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "hunter2" },
    });
    expect(await screen.findByText("$2b$12$abcdef")).toBeInTheDocument();
    expect(invokeSpy).toHaveBeenCalledWith(
      "run_action",
      expect.objectContaining({ action: "pwhash.hash" }),
    );
  });

  it("verifies a matching password via pwhash.verify", async () => {
    invokeImpl = () => Promise.resolve({ valid: true });
    render(<PasswordHashTool />);
    fireEvent.click(screen.getByRole("radio", { name: "Verify" }));
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "hunter2" },
    });
    fireEvent.change(screen.getByLabelText("Hash to verify"), {
      target: { value: "$2b$12$abcdef" },
    });
    expect(await screen.findByText("valid")).toBeInTheDocument();
    expect(invokeSpy).toHaveBeenCalledWith(
      "run_action",
      expect.objectContaining({ action: "pwhash.verify" }),
    );
  });

  it("reports an invalid password as invalid", async () => {
    invokeImpl = () => Promise.resolve({ valid: false });
    render(<PasswordHashTool />);
    fireEvent.click(screen.getByRole("radio", { name: "Verify" }));
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "wrong" },
    });
    fireEvent.change(screen.getByLabelText("Hash to verify"), {
      target: { value: "$2b$12$abcdef" },
    });
    await waitFor(() =>
      expect(screen.getByText("invalid")).toBeInTheDocument(),
    );
  });
});
