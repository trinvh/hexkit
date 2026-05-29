import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Sidebar } from "./Sidebar";
import { useApp } from "../../store/app";
import { DEFAULT_TOOL_ID } from "../../tools/registry";

function reset() {
  useApp.setState({
    activeToolId: DEFAULT_TOOL_ID,
    paletteOpen: false,
    pinned: [],
    recents: [],
    pinnedCollapsed: false,
    recentCollapsed: false,
  });
}

describe("Sidebar", () => {
  beforeEach(reset);

  it("renders category headings and tools", () => {
    render(<Sidebar />);
    expect(screen.getByText("Formatters")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /JSON Format/ })).toBeInTheDocument();
  });

  it("selects a tool on click", async () => {
    const user = userEvent.setup();
    render(<Sidebar />);
    await user.click(screen.getByRole("button", { name: /Base64 String/ }));
    expect(useApp.getState().activeToolId).toBe("base64-string");
  });

  it("filters tools by query", async () => {
    const user = userEvent.setup();
    render(<Sidebar />);
    await user.type(screen.getByPlaceholderText("Filter tools…"), "uuid");
    expect(screen.getByRole("button", { name: /UUID/ })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /JSON Format/ }),
    ).not.toBeInTheDocument();
  });

  it("shows an empty state when nothing matches", async () => {
    const user = userEvent.setup();
    render(<Sidebar />);
    await user.type(screen.getByPlaceholderText("Filter tools…"), "zzzzz");
    expect(screen.getByText(/No tools match/)).toBeInTheDocument();
  });

  it("shows a Pinned section only when tools are pinned", () => {
    const { rerender } = render(<Sidebar />);
    expect(screen.queryByText("Pinned")).not.toBeInTheDocument();
    useApp.setState({ pinned: ["uuid-generator"] });
    rerender(<Sidebar />);
    expect(screen.getByText("Pinned")).toBeInTheDocument();
  });

  it("shows up to three recent tools with an expander for the rest", () => {
    useApp.setState({
      recents: ["uuid-generator", "base64-string", "url-encode", "hex-ascii"],
    });
    render(<Sidebar />);
    expect(screen.getByText("Recent")).toBeInTheDocument();
    // The "show all" expander appears because there are more than three.
    expect(
      screen.getByRole("button", { name: "Show all recent tools" }),
    ).toBeInTheDocument();
  });

  it("right-click on a tool opens a pin menu and pins it", async () => {
    const user = userEvent.setup();
    render(<Sidebar />);
    await user.pointer({
      keys: "[MouseRight]",
      target: screen.getByRole("button", { name: /JSON Format/ }),
    });
    await user.click(screen.getByRole("menuitem", { name: "Pin to top" }));
    expect(useApp.getState().pinned).toContain("json-format");
  });

  it("right-click on a pinned tool offers Unpin", async () => {
    const user = userEvent.setup();
    useApp.setState({ pinned: ["uuid-generator"], pinnedCollapsed: false });
    render(<Sidebar />);
    const pinnedSection = screen.getByText("Pinned").closest("div")!
      .parentElement as HTMLElement;
    await user.pointer({
      keys: "[MouseRight]",
      target: within(pinnedSection).getByRole("button", { name: /UUID/ }),
    });
    expect(
      screen.getByRole("menuitem", { name: "Unpin" }),
    ).toBeInTheDocument();
  });

  it("collapses the Recent section via its header toggle", async () => {
    const user = userEvent.setup();
    useApp.setState({ recents: ["uuid-generator"], recentCollapsed: false });
    render(<Sidebar />);
    await user.click(screen.getByRole("button", { name: /Recent/ }));
    expect(useApp.getState().recentCollapsed).toBe(true);
  });
});
