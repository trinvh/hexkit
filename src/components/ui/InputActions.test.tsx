import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const readClipboardText = vi.fn();
vi.mock("../../lib/clipboard", () => ({
  readClipboardText: () => readClipboardText(),
}));

import { InputActions } from "./InputActions";

beforeEach(() => readClipboardText.mockReset());

describe("InputActions", () => {
  it("pastes clipboard text into the input", async () => {
    const user = userEvent.setup();
    readClipboardText.mockResolvedValue("pasted text");
    const onInput = vi.fn();
    render(<InputActions onInput={onInput} />);
    await user.click(screen.getByRole("button", { name: "Paste from clipboard" }));
    expect(onInput).toHaveBeenCalledWith("pasted text");
  });

  it("does not call onInput when the clipboard is empty", async () => {
    const user = userEvent.setup();
    readClipboardText.mockResolvedValue(null);
    const onInput = vi.fn();
    render(<InputActions onInput={onInput} />);
    await user.click(screen.getByRole("button", { name: "Paste from clipboard" }));
    expect(onInput).not.toHaveBeenCalled();
  });

  it("loads the sample when provided", async () => {
    const user = userEvent.setup();
    const onInput = vi.fn();
    render(<InputActions onInput={onInput} sample="SAMPLE" />);
    await user.click(screen.getByRole("button", { name: "Load sample" }));
    expect(onInput).toHaveBeenCalledWith("SAMPLE");
  });

  it("hides the sample button when no sample is given", () => {
    render(<InputActions onInput={vi.fn()} />);
    expect(screen.queryByRole("button", { name: "Load sample" })).toBeNull();
  });

  it("clears the input only when there is input", async () => {
    const user = userEvent.setup();
    const onInput = vi.fn();
    const { rerender } = render(<InputActions onInput={onInput} hasInput={false} />);
    expect(screen.queryByRole("button", { name: "Clear input" })).toBeNull();
    rerender(<InputActions onInput={onInput} hasInput />);
    await user.click(screen.getByRole("button", { name: "Clear input" }));
    expect(onInput).toHaveBeenCalledWith("");
  });
});
