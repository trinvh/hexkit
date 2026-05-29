import { createContext, useContext } from "react";

/** The id of the tab a tool is rendered in, so per-tab state can be scoped to it. */
export const TabContext = createContext<string>("");

export function useTabId(): string {
  return useContext(TabContext);
}
