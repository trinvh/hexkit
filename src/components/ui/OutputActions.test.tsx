import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { OutputActions } from "./OutputActions";
import { useApp } from "../../store/app";

const downloadText = vi.fn();
vi.mock("../../lib/download", () => ({
  downloadText: (...args: unknown[]) => downloadText(...args),
}));

beforeEach(() => {
  downloadText.mockReset();
  useApp.setState({ tabs: useApp.getState().tabs, seedNonce: 0 });
});

describe("OutputActions", () => {
  it("disables the menu trigger when there is no output", () => {
    render(<OutputActions value="" />);
    expect(screen.getByLabelText("More output actions")).toBeDisabled();
  });

  it("opens a new tab seeded with the output for Convert to Base64", () => {
    const before = useApp.getState().tabs.length;
    render(<OutputActions value="hello" />);
    fireEvent.click(screen.getByLabelText("More output actions"));
    fireEvent.click(screen.getByText("Convert to Base64"));

    const state = useApp.getState();
    expect(state.tabs.length).toBe(before + 1);
    expect(state.activeToolId).toBe("base64-string");
    expect(state.seed).toEqual({ value: "hello", mode: "encode" });
  });

  it("opens the Hex tool for Convert to Hex", () => {
    render(<OutputActions value="hello" />);
    fireEvent.click(screen.getByLabelText("More output actions"));
    fireEvent.click(screen.getByText("Convert to Hex"));
    expect(useApp.getState().activeToolId).toBe("hex-ascii");
  });

  it("downloads the output with the given filename", () => {
    render(<OutputActions value="payload" downloadName="result.txt" />);
    fireEvent.click(screen.getByLabelText("More output actions"));
    fireEvent.click(screen.getByText("Download"));
    expect(downloadText).toHaveBeenCalledWith("result.txt", "payload");
  });
});
