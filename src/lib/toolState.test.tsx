import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import type { ReactNode } from "react";
import { useToolState } from "./toolState";
import { TabContext } from "./tabContext";
import { useApp } from "../store/app";
import { DEFAULT_TOOL_ID } from "../tools/registry";

const wrapper =
  (tabId: string) =>
  ({ children }: { children: ReactNode }) => (
    <TabContext.Provider value={tabId}>{children}</TabContext.Provider>
  );

beforeEach(() => {
  useApp.setState({
    tabs: [{ id: "tabX", toolId: DEFAULT_TOOL_ID }],
    activeTabId: "tabX",
    activeToolId: DEFAULT_TOOL_ID,
    tabState: {},
  });
});

describe("useToolState", () => {
  it("returns the initial value when nothing is stored", () => {
    const { result } = renderHook(() => useToolState("input", "init"), {
      wrapper: wrapper("tabX"),
    });
    expect(result.current[0]).toBe("init");
  });

  it("restores a previously stored value", () => {
    useApp.setState({ tabState: { tabX: { input: "restored" } } });
    const { result } = renderHook(() => useToolState("input", "init"), {
      wrapper: wrapper("tabX"),
    });
    expect(result.current[0]).toBe("restored");
  });

  it("flushes the latest value to the store on unmount", () => {
    const { result, unmount } = renderHook(() => useToolState("input", ""), {
      wrapper: wrapper("tabX"),
    });
    act(() => result.current[1]("typed"));
    unmount();
    expect(useApp.getState().tabState.tabX?.input).toBe("typed");
  });

  it("does not resurrect state for a closed tab", () => {
    const { result, unmount } = renderHook(() => useToolState("input", ""), {
      wrapper: wrapper("ghost"),
    });
    act(() => result.current[1]("typed"));
    // Tab "ghost" is not in the store's tabs, simulating a closed tab.
    unmount();
    expect(useApp.getState().tabState.ghost).toBeUndefined();
  });
});
