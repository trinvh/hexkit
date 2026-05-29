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

import { HashTool } from "./HashTool";

beforeEach(() => {
  invokeSpy.mockReset();
  invokeImpl = () => Promise.resolve(null);
});

describe("HashTool", () => {
  it("shows digests for the input", async () => {
    invokeImpl = () =>
      Promise.resolve({
        md5: "900150983cd24fb0d6963f7d28e17f72",
        sha1: "a9993e364706816aba3e25717850c26c9cd0d89d",
        sha256:
          "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
        sha512: "ddaf35a1",
      });
    render(<HashTool />);
    fireEvent.change(screen.getByLabelText("Text to hash"), {
      target: { value: "abc" },
    });
    expect(
      await screen.findByText("900150983cd24fb0d6963f7d28e17f72"),
    ).toBeInTheDocument();
    expect(invokeSpy).toHaveBeenCalledWith(
      "run_action",
      expect.objectContaining({ action: "hash.generate" }),
    );
  });
});
