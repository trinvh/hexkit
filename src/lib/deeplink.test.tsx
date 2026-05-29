import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";

const listeners: Record<string, (event: { payload: string }) => void> = {};
const listen = vi.fn(
  (event: string, cb: (event: { payload: string }) => void) => {
    listeners[event] = cb;
    return Promise.resolve(() => {});
  },
);
vi.mock("@tauri-apps/api/event", () => ({
  listen: (event: string, cb: (e: { payload: string }) => void) =>
    listen(event, cb),
}));

import { useDeepLinkNavigation } from "./deeplink";
import { useApp } from "../store/app";
import { DEFAULT_TOOL_ID } from "../tools/registry";

beforeEach(() => {
  listen.mockClear();
  for (const key of Object.keys(listeners)) delete listeners[key];
  useApp.setState({ activeToolId: DEFAULT_TOOL_ID, paletteOpen: false });
});

afterEach(() => {
  delete (window as unknown as { __TAURI_INTERNALS__?: unknown })
    .__TAURI_INTERNALS__;
});

describe("useDeepLinkNavigation", () => {
  it("does nothing outside the Tauri runtime", () => {
    renderHook(() => useDeepLinkNavigation());
    expect(listen).not.toHaveBeenCalled();
  });

  it("navigates to the tool matching a deep-link action", () => {
    (window as unknown as { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__ =
      {};
    renderHook(() => useDeepLinkNavigation());

    expect(listen).toHaveBeenCalledWith(
      "deep-link://navigate",
      expect.any(Function),
    );
    listeners["deep-link://navigate"]?.({ payload: "jwt.decode" });
    expect(useApp.getState().activeToolId).toBe("jwt-debugger");
  });

  it("ignores actions with no matching tool", () => {
    (window as unknown as { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__ =
      {};
    renderHook(() => useDeepLinkNavigation());
    listeners["deep-link://navigate"]?.({ payload: "mystery.thing" });
    expect(useApp.getState().activeToolId).toBe(DEFAULT_TOOL_ID);
  });
});
