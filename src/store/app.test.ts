import { describe, it, expect, beforeEach } from "vitest";
import { useApp } from "./app";
import { DEFAULT_TOOL_ID } from "../tools/registry";

describe("useApp", () => {
  beforeEach(() => {
    useApp.setState({
      activeToolId: DEFAULT_TOOL_ID,
      paletteOpen: false,
      seed: null,
      seedNonce: 0,
      pinned: [],
      recents: [],
      pinnedCollapsed: false,
      recentCollapsed: false,
    });
  });

  it("starts on the default tool with the palette closed", () => {
    expect(useApp.getState().activeToolId).toBe(DEFAULT_TOOL_ID);
    expect(useApp.getState().paletteOpen).toBe(false);
  });

  it("setActiveTool selects a tool and closes the palette", () => {
    useApp.setState({ paletteOpen: true });
    useApp.getState().setActiveTool("base64-string");
    expect(useApp.getState().activeToolId).toBe("base64-string");
    expect(useApp.getState().paletteOpen).toBe(false);
  });

  it("togglePalette flips the palette open state", () => {
    useApp.getState().togglePalette();
    expect(useApp.getState().paletteOpen).toBe(true);
    useApp.getState().togglePalette();
    expect(useApp.getState().paletteOpen).toBe(false);
  });

  it("setPaletteOpen sets the palette state directly", () => {
    useApp.getState().setPaletteOpen(true);
    expect(useApp.getState().paletteOpen).toBe(true);
  });

  it("openToolWithSeed activates the tool, seeds input, and bumps the nonce", () => {
    useApp.setState({ paletteOpen: true });
    useApp.getState().openToolWithSeed("base64-string", "aGk=", "decode");
    const state = useApp.getState();
    expect(state.activeToolId).toBe("base64-string");
    expect(state.paletteOpen).toBe(false);
    expect(state.seed).toEqual({ value: "aGk=", mode: "decode" });
    expect(state.seedNonce).toBe(1);
  });

  describe("recents", () => {
    it("records the most recently used tool first", () => {
      useApp.getState().setActiveTool("base64-string");
      useApp.getState().setActiveTool("uuid");
      expect(useApp.getState().recents.slice(0, 2)).toEqual([
        "uuid",
        "base64-string",
      ]);
    });

    it("dedupes a re-used tool to the front without duplicating", () => {
      useApp.getState().setActiveTool("base64-string");
      useApp.getState().setActiveTool("uuid");
      useApp.getState().setActiveTool("base64-string");
      const recents = useApp.getState().recents;
      expect(recents[0]).toBe("base64-string");
      expect(recents.filter((id) => id === "base64-string")).toHaveLength(1);
    });

    it("records recents when opening a tool with a seed", () => {
      useApp.getState().openToolWithSeed("uuid", "x");
      expect(useApp.getState().recents[0]).toBe("uuid");
    });

    it("caps the recents list", () => {
      // Use more distinct ids than the cap so we can observe truncation.
      const ids = [
        "json-format",
        "base64-string",
        "uuid",
        "url-encode",
        "hex-ascii",
        "jwt-debugger",
        "color-converter",
        "unix-time",
        "number-base",
        "string-case",
        "cron-parser",
        "lorem-ipsum",
        "sql-formatter",
        "css-beautify",
        "xml-beautify",
        "yaml-json",
        "csv-json",
        "php-json",
        "markdown-preview",
        "html-preview",
      ];
      for (const id of ids) useApp.getState().setActiveTool(id);
      expect(useApp.getState().recents.length).toBeLessThanOrEqual(15);
      // Most recent stays at the front.
      expect(useApp.getState().recents[0]).toBe("html-preview");
    });
  });

  describe("pinned", () => {
    it("togglePinned adds then removes a tool", () => {
      useApp.getState().togglePinned("uuid");
      expect(useApp.getState().pinned).toContain("uuid");
      useApp.getState().togglePinned("uuid");
      expect(useApp.getState().pinned).not.toContain("uuid");
    });

    it("auto-collapses Recent when the first tool is pinned", () => {
      expect(useApp.getState().recentCollapsed).toBe(false);
      useApp.getState().togglePinned("uuid");
      expect(useApp.getState().recentCollapsed).toBe(true);
    });

    it("re-expands Recent when the last pin is removed", () => {
      useApp.getState().togglePinned("uuid");
      useApp.getState().togglePinned("base64-string");
      useApp.getState().togglePinned("uuid");
      // Still one pin left → stays collapsed.
      expect(useApp.getState().recentCollapsed).toBe(true);
      useApp.getState().togglePinned("base64-string");
      // No pins left → Recent re-expands.
      expect(useApp.getState().recentCollapsed).toBe(false);
    });

    it("setPinnedCollapsed and setRecentCollapsed toggle section state", () => {
      useApp.getState().setPinnedCollapsed(true);
      expect(useApp.getState().pinnedCollapsed).toBe(true);
      useApp.getState().setRecentCollapsed(true);
      expect(useApp.getState().recentCollapsed).toBe(true);
    });
  });
});
