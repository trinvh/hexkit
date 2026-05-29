import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

const invokeSpy = vi.fn();
let invokeImpl: (...args: unknown[]) => Promise<unknown> = () =>
  Promise.resolve(null);
vi.mock("@tauri-apps/api/core", () => ({
  invoke: (...args: unknown[]) => {
    invokeSpy(...args);
    return invokeImpl(...args);
  },
}));

import { CronTool } from "./CronTool";

beforeEach(() => {
  invokeSpy.mockReset();
  invokeImpl = () => Promise.resolve(null);
});

describe("CronTool", () => {
  it("lists upcoming runs", async () => {
    invokeImpl = () =>
      Promise.resolve({
        next_runs: ["2026-01-01T00:00:00+00:00", "2026-01-02T00:00:00+00:00"],
      });
    render(<CronTool />);
    fireEvent.change(screen.getByLabelText("Cron expression"), {
      target: { value: "0 0 * * *" },
    });
    await waitFor(() =>
      expect(screen.getByText("2026-01-01T00:00:00+00:00")).toBeInTheDocument(),
    );
    expect(screen.getByText("Run 1")).toBeInTheDocument();
    expect(invokeSpy).toHaveBeenCalledWith(
      "run_action",
      expect.objectContaining({ action: "cron.parse" }),
    );
  });
});
