import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TabBar } from "./TabBar";
import { useApp } from "../../store/app";
import { DEFAULT_TOOL_ID } from "../../tools/registry";

beforeEach(() => {
  useApp.setState({
    tabs: [{ id: "main", toolId: DEFAULT_TOOL_ID }],
    activeTabId: "main",
    activeToolId: DEFAULT_TOOL_ID,
    tabState: {},
  });
});

describe("TabBar", () => {
  it("is hidden when there is only one tab", () => {
    const { container } = render(<TabBar />);
    expect(container.firstChild).toBeNull();
  });

  it("shows a tab per open tab once there are two or more", () => {
    useApp.setState({
      tabs: [
        { id: "main", toolId: "json-format" },
        { id: "t2", toolId: "base64-string" },
      ],
      activeTabId: "main",
      activeToolId: "json-format",
    });
    render(<TabBar />);
    expect(screen.getByRole("tab", { name: /JSON Format/ })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Base64 String/ })).toBeInTheDocument();
  });

  it("switches the active tab on click", async () => {
    const user = userEvent.setup();
    useApp.setState({
      tabs: [
        { id: "main", toolId: "json-format" },
        { id: "t2", toolId: "base64-string" },
      ],
      activeTabId: "main",
      activeToolId: "json-format",
    });
    render(<TabBar />);
    await user.click(screen.getByRole("tab", { name: /Base64 String/ }));
    expect(useApp.getState().activeTabId).toBe("t2");
    expect(useApp.getState().activeToolId).toBe("base64-string");
  });

  it("closes a tab via its close button", async () => {
    const user = userEvent.setup();
    useApp.setState({
      tabs: [
        { id: "main", toolId: "json-format" },
        { id: "t2", toolId: "base64-string" },
      ],
      activeTabId: "t2",
      activeToolId: "base64-string",
    });
    render(<TabBar />);
    await user.click(screen.getByRole("button", { name: /Close Base64 String/ }));
    expect(useApp.getState().tabs).toHaveLength(1);
    expect(useApp.getState().activeTabId).toBe("main");
  });

  it("opens a new tab from the + button", async () => {
    const user = userEvent.setup();
    useApp.setState({
      tabs: [
        { id: "main", toolId: "json-format" },
        { id: "t2", toolId: "base64-string" },
      ],
      activeTabId: "main",
      activeToolId: "json-format",
    });
    render(<TabBar />);
    await user.click(screen.getByRole("button", { name: "New tab" }));
    expect(useApp.getState().tabs).toHaveLength(3);
    expect(useApp.getState().tabs[2].toolId).toBe(DEFAULT_TOOL_ID);
  });
});
