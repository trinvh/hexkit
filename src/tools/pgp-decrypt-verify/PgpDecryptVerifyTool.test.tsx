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

import { PgpDecryptVerifyTool } from "./PgpDecryptVerifyTool";

beforeEach(() => {
  invokeSpy.mockReset();
});

describe("PgpDecryptVerifyTool", () => {
  it("shows plaintext and a valid badge on success", async () => {
    invokeImpl = () =>
      Promise.resolve({
        plaintext: "secret message",
        verification: {
          valid: true,
          signer_fingerprint: "ABCDEF0123456789ABCDEF0123456789ABCDEF01",
          reason: null,
        },
      });
    render(<PgpDecryptVerifyTool />);
    fireEvent.change(screen.getByLabelText("Ciphertext"), {
      target: { value: "-----BEGIN PGP MESSAGE-----\nfake\n-----END PGP MESSAGE-----" },
    });
    fireEvent.change(screen.getByLabelText("Recipient private key"), {
      target: { value: "-----BEGIN PGP PRIVATE KEY BLOCK-----\nfake\n-----END PGP PRIVATE KEY BLOCK-----" },
    });
    fireEvent.change(screen.getByLabelText("Sender public key"), {
      target: { value: "-----BEGIN PGP PUBLIC KEY BLOCK-----\nfake\n-----END PGP PUBLIC KEY BLOCK-----" },
    });
    expect(await screen.findByText(/Decrypted and signature valid/i)).toBeInTheDocument();
    expect(screen.getByText("secret message")).toBeInTheDocument();
  });
});
