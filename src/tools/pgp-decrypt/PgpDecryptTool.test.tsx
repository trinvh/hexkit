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

import { PgpDecryptTool } from "./PgpDecryptTool";

beforeEach(() => {
  invokeSpy.mockReset();
  invokeImpl = () => Promise.resolve({ plaintext: "secret message" });
});

describe("PgpDecryptTool", () => {
  it("shows decrypted plaintext when ciphertext + key are provided", async () => {
    render(<PgpDecryptTool />);
    fireEvent.change(screen.getByLabelText("Ciphertext"), {
      target: { value: "-----BEGIN PGP MESSAGE-----\nfake\n-----END PGP MESSAGE-----" },
    });
    fireEvent.change(screen.getByLabelText("Private key"), {
      target: { value: "-----BEGIN PGP PRIVATE KEY BLOCK-----\nfake\n-----END PGP PRIVATE KEY BLOCK-----" },
    });
    expect(await screen.findByText("secret message")).toBeInTheDocument();
  });
});
