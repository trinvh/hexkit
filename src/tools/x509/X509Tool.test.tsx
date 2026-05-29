import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

const invokeSpy = vi.fn();
let invokeImpl: (...a: unknown[]) => Promise<unknown> = () => Promise.resolve(null);
vi.mock("@tauri-apps/api/core", () => ({
  invoke: (...a: unknown[]) => {
    invokeSpy(...a);
    return invokeImpl(...a);
  },
}));
vi.mock("../../components/ui/CodeEditor", () => ({
  CodeEditor: ({
    value,
    onChange,
    ariaLabel,
  }: {
    value: string;
    onChange?: (v: string) => void;
    ariaLabel?: string;
  }) => (
    <textarea
      aria-label={ariaLabel}
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
    />
  ),
}));

import { X509Tool } from "./X509Tool";

beforeEach(() => {
  invokeSpy.mockReset();
  invokeImpl = () => Promise.resolve(null);
});

describe("X509Tool", () => {
  it("shows decoded certificate fields", async () => {
    invokeImpl = () =>
      Promise.resolve({
        subject: "CN=hexkit.example",
        issuer: "CN=Hexkit Root CA",
        serial: "0a1b2c",
        not_before: "2026-01-01",
        not_after: "2027-01-01",
        signature_algorithm: "1.2.840.113549.1.1.11",
        version: "V3",
      });
    render(<X509Tool />);
    fireEvent.change(screen.getByLabelText("Certificate (PEM)"), {
      target: { value: "-----BEGIN CERTIFICATE-----\nabc\n-----END CERTIFICATE-----" },
    });
    await waitFor(() =>
      expect(screen.getByText("CN=hexkit.example")).toBeInTheDocument(),
    );
    expect(screen.getByText("0a1b2c")).toBeInTheDocument();
    expect(invokeSpy).toHaveBeenCalledWith(
      "run_action",
      expect.objectContaining({ action: "x509.decode" }),
    );
  });
});
