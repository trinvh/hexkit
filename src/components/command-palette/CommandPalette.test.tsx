import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CommandPalette } from "./CommandPalette";
import { useApp } from "../../store/app";
import { DEFAULT_TOOL_ID } from "../../tools/registry";

describe("CommandPalette", () => {
  beforeEach(() => {
    useApp.setState({ activeToolId: DEFAULT_TOOL_ID, paletteOpen: false });
  });

  it("renders nothing while closed", () => {
    const { container } = render(<CommandPalette />);
    expect(container).toBeEmptyDOMElement();
  });

  it("lists tools when open", () => {
    useApp.setState({ paletteOpen: true });
    render(<CommandPalette />);
    expect(screen.getByText("JSON Format / Validate")).toBeInTheDocument();
    expect(screen.getByText("Base64 String")).toBeInTheDocument();
  });

  it("filters tools as you type", async () => {
    useApp.setState({ paletteOpen: true });
    const user = userEvent.setup();
    render(<CommandPalette />);
    await user.type(screen.getByPlaceholderText("Search tools…"), "base");
    expect(screen.getByText("Base64 String")).toBeInTheDocument();
    expect(screen.queryByText("JSON Format / Validate")).not.toBeInTheDocument();
  });

  it("selects a tool and closes on click", async () => {
    useApp.setState({ paletteOpen: true });
    const user = userEvent.setup();
    render(<CommandPalette />);
    await user.click(screen.getByText("Base64 String"));
    expect(useApp.getState().activeToolId).toBe("base64-string");
    expect(useApp.getState().paletteOpen).toBe(false);
  });

  it("closes on Escape", () => {
    useApp.setState({ paletteOpen: true });
    render(<CommandPalette />);
    fireEvent.keyDown(window, { key: "Escape" });
    expect(useApp.getState().paletteOpen).toBe(false);
  });
});
