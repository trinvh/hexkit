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

import { PgpEncryptSignTool } from "./PgpEncryptSignTool";

beforeEach(() => {
  invokeSpy.mockReset();
  invokeImpl = () =>
    Promise.resolve("-----BEGIN PGP MESSAGE-----\nct\n-----END PGP MESSAGE-----");
});

describe("PgpEncryptSignTool", () => {
  it("renders the encrypted + signed message", async () => {
    render(<PgpEncryptSignTool />);
    fireEvent.change(screen.getByLabelText("Plaintext"), { target: { value: "hi" } });
    fireEvent.change(screen.getByLabelText("Recipient public key"), {
      target: { value: "-----BEGIN PGP PUBLIC KEY BLOCK-----\nfake\n-----END PGP PUBLIC KEY BLOCK-----" },
    });
    fireEvent.change(screen.getByLabelText("Sender private key"), {
      target: { value: "-----BEGIN PGP PRIVATE KEY BLOCK-----\nfake\n-----END PGP PRIVATE KEY BLOCK-----" },
    });
    expect(await screen.findByText(/Encrypted \+ signed message/i)).toBeInTheDocument();
  });
});
