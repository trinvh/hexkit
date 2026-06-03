import { describe, it, expect, beforeEach } from "vitest";
import { useApp } from "./app";
import { DEFAULT_TOOL_ID } from "../tools/registry";

function reset() {
  const main = { id: "main", toolId: DEFAULT_TOOL_ID };
  useApp.setState({
    tabs: [main],
    activeTabId: main.id,
    activeToolId: DEFAULT_TOOL_ID,
    paletteOpen: false,
    seed: null,
    seedNonce: 0,
    pinned: [],
    recents: [],
    pinnedCollapsed: false,
    recentCollapsed: false,
    autoUpdateCheck: true,
    tabState: {},
  });
}

describe("useApp", () => {
  beforeEach(reset);

  it("starts with one main tab on the default tool", () => {
    const s = useApp.getState();
    expect(s.tabs).toHaveLength(1);
    expect(s.activeToolId).toBe(DEFAULT_TOOL_ID);
    expect(s.activeTabId).toBe(s.tabs[0].id);
    expect(s.paletteOpen).toBe(false);
  });

  it("toggles autoUpdateCheck, which is on by default", () => {
    expect(useApp.getState().autoUpdateCheck).toBe(true);
    useApp.getState().setAutoUpdateCheck(false);
    expect(useApp.getState().autoUpdateCheck).toBe(false);
    useApp.getState().setAutoUpdateCheck(true);
    expect(useApp.getState().autoUpdateCheck).toBe(true);
  });

  it("setActiveTool retargets the active tab and records it", () => {
    useApp.setState({ paletteOpen: true });
    useApp.getState().setActiveTool("base64-string");
    const s = useApp.getState();
    expect(s.activeToolId).toBe("base64-string");
    expect(s.tabs[0].toolId).toBe("base64-string");
    expect(s.paletteOpen).toBe(false);
    expect(s.recents[0]).toBe("base64-string");
  });

  it("togglePalette flips the palette open state", () => {
    useApp.getState().togglePalette();
    expect(useApp.getState().paletteOpen).toBe(true);
    useApp.getState().togglePalette();
    expect(useApp.getState().paletteOpen).toBe(false);
  });

  it("openToolWithSeed retargets the active tab, seeds, and bumps the nonce", () => {
    useApp.getState().openToolWithSeed("base64-string", "aGk=", "decode");
    const s = useApp.getState();
    expect(s.activeToolId).toBe("base64-string");
    expect(s.tabs[0].toolId).toBe("base64-string");
    expect(s.seed).toEqual({ value: "aGk=", mode: "decode" });
    expect(s.seedNonce).toBe(1);
  });

  describe("tabs", () => {
    it("openInNewTab adds and activates a tab, allowing duplicates", () => {
      useApp.getState().openInNewTab("uuid-generator");
      useApp.getState().openInNewTab("uuid-generator");
      const s = useApp.getState();
      expect(s.tabs).toHaveLength(3);
      expect(s.tabs[1].toolId).toBe("uuid-generator");
      expect(s.tabs[2].toolId).toBe("uuid-generator");
      expect(s.tabs[1].id).not.toBe(s.tabs[2].id);
      expect(s.activeTabId).toBe(s.tabs[2].id);
      expect(s.activeToolId).toBe("uuid-generator");
    });

    it("setActiveTab switches the active tab and tool", () => {
      useApp.getState().openInNewTab("uuid-generator");
      const first = useApp.getState().tabs[0];
      useApp.getState().setActiveTab(first.id);
      expect(useApp.getState().activeTabId).toBe(first.id);
      expect(useApp.getState().activeToolId).toBe(first.toolId);
    });

    it("closeTab activates the neighbour when the active tab is closed", () => {
      useApp.getState().openInNewTab("uuid-generator"); // tab 2 (active)
      const [main, second] = useApp.getState().tabs;
      useApp.getState().closeTab(second.id);
      const s = useApp.getState();
      expect(s.tabs).toHaveLength(1);
      expect(s.activeTabId).toBe(main.id);
      expect(s.activeToolId).toBe(main.toolId);
    });

    it("closing the last tab resets to a fresh main tab", () => {
      const only = useApp.getState().tabs[0];
      useApp.getState().closeTab(only.id);
      const s = useApp.getState();
      expect(s.tabs).toHaveLength(1);
      expect(s.activeToolId).toBe(DEFAULT_TOOL_ID);
      expect(s.tabs[0].id).not.toBe(only.id);
    });

    it("closeTab drops the closed tab's persisted state", () => {
      useApp.getState().openInNewTab("uuid-generator");
      const second = useApp.getState().tabs[1];
      useApp.getState().setTabField(second.id, "input", "x");
      expect(useApp.getState().tabState[second.id]).toBeDefined();
      useApp.getState().closeTab(second.id);
      expect(useApp.getState().tabState[second.id]).toBeUndefined();
    });
  });

  describe("tab field state", () => {
    it("setTabField stores values per tab and field", () => {
      useApp.getState().setTabField("main", "input", "hello");
      useApp.getState().setTabField("main", "mode", "decode");
      expect(useApp.getState().tabState.main).toEqual({
        input: "hello",
        mode: "decode",
      });
    });
  });

  describe("pinned", () => {
    it("togglePinned adds then removes a tool", () => {
      useApp.getState().togglePinned("uuid-generator");
      expect(useApp.getState().pinned).toContain("uuid-generator");
      useApp.getState().togglePinned("uuid-generator");
      expect(useApp.getState().pinned).not.toContain("uuid-generator");
    });

    it("auto-collapses Recent on first pin and re-expands when the last is removed", () => {
      useApp.getState().togglePinned("uuid-generator");
      expect(useApp.getState().recentCollapsed).toBe(true);
      useApp.getState().togglePinned("uuid-generator");
      expect(useApp.getState().recentCollapsed).toBe(false);
    });
  });

  describe("recents", () => {
    it("records the most recently used tool first and dedupes", () => {
      useApp.getState().setActiveTool("base64-string");
      useApp.getState().setActiveTool("uuid-generator");
      useApp.getState().setActiveTool("base64-string");
      const recents = useApp.getState().recents;
      expect(recents[0]).toBe("base64-string");
      expect(recents.filter((id) => id === "base64-string")).toHaveLength(1);
    });
  });
});
