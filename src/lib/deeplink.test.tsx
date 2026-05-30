import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";

interface DeepLinkPayload {
  action: string;
  params: Record<string, unknown>;
}

const listeners: Record<string, (event: { payload: DeepLinkPayload }) => void> = {};
const listen = vi.fn(
  (event: string, cb: (event: { payload: DeepLinkPayload }) => void) => {
    listeners[event] = cb;
    return Promise.resolve(() => {});
  },
);
vi.mock("@tauri-apps/api/event", () => ({
  listen: (event: string, cb: (e: { payload: DeepLinkPayload }) => void) =>
    listen(event, cb),
}));

import { useDeepLinkNavigation } from "./deeplink";
import { useApp } from "../store/app";
import { DEFAULT_TOOL_ID } from "../tools/registry";

beforeEach(() => {
  listen.mockClear();
  for (const key of Object.keys(listeners)) delete listeners[key];
  useApp.setState({
    activeToolId: DEFAULT_TOOL_ID,
    paletteOpen: false,
    seed: null,
    seedNonce: 0,
  });
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
    listeners["deep-link://navigate"]?.({
      payload: { action: "jwt.decode", params: {} },
    });
    expect(useApp.getState().activeToolId).toBe("jwt-debugger");
  });

  it("seeds the destination tool when params include `input`", () => {
    (window as unknown as { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__ =
      {};
    renderHook(() => useDeepLinkNavigation());

    listeners["deep-link://navigate"]?.({
      payload: {
        action: "base64.encode",
        params: { input: "hello world" },
      },
    });

    const state = useApp.getState();
    expect(state.activeToolId).toBe("base64-string");
    expect(state.seed?.value).toBe("hello world");
    expect(state.seedNonce).toBe(1);
  });

  it("ignores actions with no matching tool", () => {
    (window as unknown as { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__ =
      {};
    renderHook(() => useDeepLinkNavigation());
    listeners["deep-link://navigate"]?.({
      payload: { action: "mystery.thing", params: {} },
    });
    expect(useApp.getState().activeToolId).toBe(DEFAULT_TOOL_ID);
  });
});
