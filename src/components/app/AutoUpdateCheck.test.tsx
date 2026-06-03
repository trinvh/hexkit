import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, waitFor } from "@testing-library/react";

const checkForUpdate = vi.fn();
vi.mock("../../lib/updateCheck", () => ({
  checkForUpdate: () => checkForUpdate(),
}));
// Pretend we're in the desktop app so the effect doesn't short-circuit.
vi.mock("../../lib/cli", () => ({ isTauri: () => true }));

import { AutoUpdateCheck } from "./AutoUpdateCheck";
import { useApp } from "../../store/app";

beforeEach(() => {
  checkForUpdate.mockReset();
  checkForUpdate.mockResolvedValue({ status: "up-to-date" });
});

describe("AutoUpdateCheck", () => {
  it("checks for updates on launch when the setting is on", async () => {
    useApp.setState({ autoUpdateCheck: true });
    render(<AutoUpdateCheck />);
    await waitFor(() => expect(checkForUpdate).toHaveBeenCalledTimes(1));
  });

  it("does not check when the setting is off", () => {
    useApp.setState({ autoUpdateCheck: false });
    render(<AutoUpdateCheck />);
    expect(checkForUpdate).not.toHaveBeenCalled();
  });
});
