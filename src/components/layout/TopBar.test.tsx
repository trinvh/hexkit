import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TopBar } from "./TopBar";
import { useApp } from "../../store/app";

describe("TopBar", () => {
  beforeEach(() => {
    useApp.setState({
      activeToolId: "json-format",
      paletteOpen: false,
      pinned: [],
      recents: [],
      pinnedCollapsed: false,
      recentCollapsed: false,
    });
  });

  it("shows the active tool name and description", () => {
    render(<TopBar />);
    expect(
      screen.getByRole("heading", { name: "JSON Format / Validate" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Pretty-print/)).toBeInTheDocument();
  });

  it("opens the palette from the search button", async () => {
    const user = userEvent.setup();
    render(<TopBar />);
    await user.click(screen.getByRole("button", { name: /search/i }));
    expect(useApp.getState().paletteOpen).toBe(true);
  });

  it("offers a clipboard detection button", () => {
    render(<TopBar />);
    expect(screen.getByRole("button", { name: "Detect" })).toBeInTheDocument();
  });

  it("pins the active tool from the three-dot menu", async () => {
    const user = userEvent.setup();
    render(<TopBar />);
    await user.click(screen.getByRole("button", { name: "Tool actions" }));
    await user.click(screen.getByRole("menuitem", { name: "Pin to top" }));
    expect(useApp.getState().pinned).toContain("json-format");
  });

  it("offers Unpin when the active tool is already pinned", async () => {
    const user = userEvent.setup();
    useApp.setState({ pinned: ["json-format"] });
    render(<TopBar />);
    await user.click(screen.getByRole("button", { name: "Tool actions" }));
    expect(screen.getByRole("menuitem", { name: "Unpin" })).toBeInTheDocument();
  });
});
