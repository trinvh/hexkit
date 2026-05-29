import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const { toast } = vi.hoisted(() => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));
vi.mock("sonner", () => ({ toast }));

import { CopyButton } from "./CopyButton";

describe("CopyButton", () => {
  beforeEach(() => {
    toast.success.mockReset();
    toast.error.mockReset();
  });

  it("is disabled when there is nothing to copy", () => {
    render(<CopyButton value="" />);
    expect(screen.getByRole("button")).toBeDisabled();
  });

  function setClipboard(writeText: (text: string) => Promise<void>) {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
  }

  it("writes the value to the clipboard and toasts on success", async () => {
    // setup() installs its own clipboard stub, so override it afterwards.
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    setClipboard(writeText);

    render(<CopyButton value="hello" />);
    await user.click(screen.getByRole("button"));

    expect(writeText).toHaveBeenCalledWith("hello");
    await waitFor(() => expect(toast.success).toHaveBeenCalled());
  });

  it("toasts an error when the clipboard write fails", async () => {
    const user = userEvent.setup();
    // Plain rejecting function (not a spy) so its rejection isn't tracked.
    setClipboard(() => Promise.reject(new Error("nope")));

    render(<CopyButton value="hello" />);
    await user.click(screen.getByRole("button"));

    await waitFor(() => expect(toast.error).toHaveBeenCalled());
  });
});
