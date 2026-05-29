import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";

const invokeSpy = vi.fn();
let invokeImpl: (...args: unknown[]) => Promise<unknown> = () =>
  Promise.resolve("");
vi.mock("@tauri-apps/api/core", () => ({
  invoke: (...args: unknown[]) => {
    invokeSpy(...args);
    return invokeImpl(...args);
  },
}));

import { RandomTool } from "./RandomTool";

beforeEach(() => {
  invokeSpy.mockReset();
  invokeImpl = () => Promise.resolve("ABC123xyz");
});

describe("RandomTool", () => {
  it("generates a random string on mount", async () => {
    render(<RandomTool />);
    await waitFor(() => expect(screen.getByText("ABC123xyz")).toBeInTheDocument());
    expect(invokeSpy).toHaveBeenCalledWith(
      "run_action",
      expect.objectContaining({ action: "random.generate" }),
    );
  });

  it("surfaces an error when no character set is selected", async () => {
    invokeImpl = () =>
      Promise.reject({ kind: "invalid_input", message: "select at least one character set" });
    render(<RandomTool />);
    await waitFor(() =>
      expect(screen.getByText(/select at least one/)).toBeInTheDocument(),
    );
  });
});
