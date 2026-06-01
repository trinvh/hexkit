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

import { PgpKeygenTool } from "./PgpKeygenTool";

beforeEach(() => {
  invokeSpy.mockReset();
  invokeImpl = () => Promise.resolve(null);
});

describe("PgpKeygenTool", () => {
  it("disables Generate until a user id is entered", () => {
    render(<PgpKeygenTool />);
    const button = screen.getByRole("button", { name: /generate/i });
    expect(button).toBeDisabled();

    fireEvent.change(screen.getByLabelText("User ID"), {
      target: { value: "Alice <alice@hexkit.app>" },
    });
    expect(button).not.toBeDisabled();
  });

  it("shows the public/private key blocks after a successful generation", async () => {
    invokeImpl = () =>
      Promise.resolve({
        private_key: "-----BEGIN PGP PRIVATE KEY BLOCK-----\nbody\n-----END PGP PRIVATE KEY BLOCK-----",
        public_key: "-----BEGIN PGP PUBLIC KEY BLOCK-----\nbody\n-----END PGP PUBLIC KEY BLOCK-----",
        fingerprint: "ABCDEF0123456789ABCDEF0123456789ABCDEF01",
      });
    render(<PgpKeygenTool />);
    fireEvent.change(screen.getByLabelText("User ID"), {
      target: { value: "Alice <alice@hexkit.app>" },
    });
    fireEvent.click(screen.getByRole("button", { name: /generate/i }));
    // Wait for the fingerprint pane (a unique, exact-match string) to land,
    // then assert the two key labels by exact text — case-insensitive matches
    // would collide with the "PUBLIC KEY BLOCK" header inside each value.
    expect(
      await screen.findByText("ABCDEF0123456789ABCDEF0123456789ABCDEF01"),
    ).toBeInTheDocument();
    expect(screen.getByText("Public key", { selector: "span" })).toBeInTheDocument();
    expect(screen.getByText("Private key", { selector: "span" })).toBeInTheDocument();
  });
});
