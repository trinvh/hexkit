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

import { PgpEncryptTool } from "./PgpEncryptTool";

beforeEach(() => {
  invokeSpy.mockReset();
  invokeImpl = () => Promise.resolve("-----BEGIN PGP MESSAGE-----\nbody\n-----END PGP MESSAGE-----");
});

describe("PgpEncryptTool", () => {
  it("invokes pgp.encrypt once both inputs are filled", async () => {
    render(<PgpEncryptTool />);
    fireEvent.change(screen.getByLabelText("Plaintext"), { target: { value: "hi" } });
    fireEvent.change(screen.getByLabelText("Recipient public key"), {
      target: { value: "-----BEGIN PGP PUBLIC KEY BLOCK-----\nfake\n-----END PGP PUBLIC KEY BLOCK-----" },
    });
    expect(await screen.findByText(/Encrypted message/i)).toBeInTheDocument();
  });
});
