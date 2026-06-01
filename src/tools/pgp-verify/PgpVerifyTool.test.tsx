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

import { PgpVerifyTool } from "./PgpVerifyTool";

beforeEach(() => {
  invokeSpy.mockReset();
});

describe("PgpVerifyTool", () => {
  it("shows the valid badge when the backend reports valid", async () => {
    invokeImpl = () =>
      Promise.resolve({
        valid: true,
        signer_fingerprint: "ABCDEF0123456789ABCDEF0123456789ABCDEF01",
        reason: null,
      });
    render(<PgpVerifyTool />);
    fireEvent.change(screen.getByLabelText("Signed data"), { target: { value: "hi" } });
    fireEvent.change(screen.getByLabelText("Signature"), {
      target: { value: "-----BEGIN PGP SIGNATURE-----\nsig\n-----END PGP SIGNATURE-----" },
    });
    fireEvent.change(screen.getByLabelText("Public key"), {
      target: { value: "-----BEGIN PGP PUBLIC KEY BLOCK-----\nfake\n-----END PGP PUBLIC KEY BLOCK-----" },
    });
    expect(await screen.findByText(/Signature valid/i)).toBeInTheDocument();
    expect(
      screen.getByText(/ABCDEF0123456789ABCDEF0123456789ABCDEF01/),
    ).toBeInTheDocument();
  });

  it("shows the invalid badge with reason on bad signature", async () => {
    invokeImpl = () =>
      Promise.resolve({
        valid: false,
        signer_fingerprint: null,
        reason: "signature does not match",
      });
    render(<PgpVerifyTool />);
    fireEvent.change(screen.getByLabelText("Signed data"), { target: { value: "hi" } });
    fireEvent.change(screen.getByLabelText("Signature"), {
      target: { value: "-----BEGIN PGP SIGNATURE-----\nsig\n-----END PGP SIGNATURE-----" },
    });
    fireEvent.change(screen.getByLabelText("Public key"), {
      target: { value: "-----BEGIN PGP PUBLIC KEY BLOCK-----\nfake\n-----END PGP PUBLIC KEY BLOCK-----" },
    });
    expect(await screen.findByText(/Signature invalid/i)).toBeInTheDocument();
    expect(screen.getByText(/signature does not match/i)).toBeInTheDocument();
  });
});
