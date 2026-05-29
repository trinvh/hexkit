import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const invokeSpy = vi.fn();
let invokeImpl: (...args: unknown[]) => Promise<unknown> = () =>
  Promise.resolve(null);
vi.mock("@tauri-apps/api/core", () => ({
  invoke: (...args: unknown[]) => {
    invokeSpy(...args);
    return invokeImpl(...args);
  },
}));

import { TimeTool } from "./TimeTool";

const SAMPLE = {
  epoch_seconds: "1700000000",
  epoch_millis: "1700000000000",
  iso8601: "2023-11-14T22:13:20Z",
  utc: "2023-11-14 22:13:20 UTC",
  local: "2023-11-14 14:13:20 PST",
  day_of_week: "Tuesday",
};

beforeEach(() => {
  invokeSpy.mockReset();
  invokeImpl = () => Promise.resolve(SAMPLE);
});

describe("TimeTool", () => {
  it("converts a timestamp into human representations", async () => {
    render(<TimeTool />);
    fireEvent.change(screen.getByLabelText("Timestamp or date"), {
      target: { value: "1700000000" },
    });
    expect(await screen.findByText("2023-11-14T22:13:20Z")).toBeInTheDocument();
    expect(screen.getByText("Tuesday")).toBeInTheDocument();
  });

  it("fills the current epoch when Now is clicked", async () => {
    const user = userEvent.setup();
    render(<TimeTool />);
    await user.click(screen.getByRole("button", { name: "Now" }));
    const field = screen.getByLabelText("Timestamp or date") as HTMLInputElement;
    expect(field.value).toMatch(/^\d+$/);
    await waitFor(() =>
      expect(invokeSpy).toHaveBeenCalledWith(
        "run_action",
        expect.objectContaining({ action: "time.convert" }),
      ),
    );
  });
});
