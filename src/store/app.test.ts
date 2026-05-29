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
});
