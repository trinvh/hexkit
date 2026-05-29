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
  it("shows the description, field breakdown, and next executions", async () => {
    invokeImpl = () =>
      Promise.resolve({
        description: "Every 5 minutes",
        minutes: ":00, :05",
        hours: "(All)",
        day_of_month: "(All)",
        months: "(All)",
        day_of_week: "(All)",
        next_runs: ["2026-01-01T00:00:00+00:00", "2026-01-02T00:00:00+00:00"],
      });
    render(<CronTool />);
    fireEvent.change(screen.getByLabelText("Cron expression"), {
      target: { value: "*/5 * * * *" },
    });
    await waitFor(() =>
      expect(screen.getByText("Every 5 minutes")).toBeInTheDocument(),
    );
    expect(screen.getByText("Minutes")).toBeInTheDocument();
    expect(screen.getByText("Day of Week")).toBeInTheDocument();
    expect(screen.getByText("Next executions")).toBeInTheDocument();
    expect(invokeSpy).toHaveBeenCalledWith(
      "run_action",
      expect.objectContaining({ action: "cron.parse" }),
    );
  });

  it("loads an example from the picker", () => {
    render(<CronTool />);
    fireEvent.change(screen.getByLabelText("Pick an example"), {
      target: { value: "0 9 * * 1-5" },
    });
    expect(
      (screen.getByLabelText("Cron expression") as HTMLInputElement).value,
    ).toBe("0 9 * * 1-5");
  });
});
