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

import { PgpSignTool } from "./PgpSignTool";

beforeEach(() => {
  invokeSpy.mockReset();
  invokeImpl = () =>
    Promise.resolve("-----BEGIN PGP SIGNATURE-----\nsig\n-----END PGP SIGNATURE-----");
});

describe("PgpSignTool", () => {
  it("renders the detached signature", async () => {
    render(<PgpSignTool />);
    fireEvent.change(screen.getByLabelText("Data to sign"), { target: { value: "hi" } });
    fireEvent.change(screen.getByLabelText("Private key"), {
      target: { value: "-----BEGIN PGP PRIVATE KEY BLOCK-----\nfake\n-----END PGP PRIVATE KEY BLOCK-----" },
    });
    expect(await screen.findByText(/Detached signature/i)).toBeInTheDocument();
  });
});
