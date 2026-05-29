import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { DEFAULT_TOOL_ID } from "../tools/registry";

export interface ToolSeed {
  value: string;
  mode?: string;
}

/** An open tab. Each is an independent instance, so the same tool can appear twice. */
export interface Tab {
  id: string;
  toolId: string;
}

/** Most recents we keep in history (a few more than we surface in the UI). */
const MAX_RECENTS = 15;

function recordRecent(recents: string[], id: string): string[] {
  return [id, ...recents.filter((existing) => existing !== id)].slice(
    0,
    MAX_RECENTS,
  );
}

function newTabId(): string {
  return (
    globalThis.crypto?.randomUUID?.() ??
    `tab_${Date.now()}_${Math.random().toString(36).slice(2)}`
  );
}

function makeMainTab(): Tab {
  return { id: newTabId(), toolId: DEFAULT_TOOL_ID };
}

interface AppState {
  /** Open tabs, in display order. There is always at least one. */
  tabs: Tab[];
  /** Id of the active tab. */
  activeTabId: string;
  /** Active tab's tool id, mirrored for convenient `(s) => s.activeToolId` reads. */
  activeToolId: string;
  paletteOpen: boolean;
  /** Pending input to prefill into the next tool that mounts (smart detection). */
  seed: ToolSeed | null;
  /** Bumped on each seed so the active tool remounts and re-reads it. */
  seedNonce: number;
  /** Pinned tool ids, surfaced above the sidebar filter. */
  pinned: string[];
  /** Recently used tool ids, most-recent first. */
  recents: string[];
  pinnedCollapsed: boolean;
  recentCollapsed: boolean;
  /** Persisted per-tab tool field state, keyed by tab id then field name. */
  tabState: Record<string, Record<string, unknown>>;
  /** Point the active tab at `id` (records it as recent). */
  setActiveTool: (id: string) => void;
  setPaletteOpen: (open: boolean) => void;
  togglePalette: () => void;
  /** Point the active tab at `id` and prefill its primary input. */
  openToolWithSeed: (id: string, value: string, mode?: string) => void;
  /** Open `id` in a brand-new tab and activate it. */
  openInNewTab: (id: string) => void;
  setActiveTab: (tabId: string) => void;
  closeTab: (tabId: string) => void;
  /** Pin or unpin a tool. Pinning the first tool auto-collapses Recent. */
  togglePinned: (id: string) => void;
  setPinnedCollapsed: (collapsed: boolean) => void;
  setRecentCollapsed: (collapsed: boolean) => void;
  /** Persist a single field for a tab (used by the useToolState hook). */
  setTabField: (tabId: string, field: string, value: unknown) => void;
}

const INITIAL_TAB = makeMainTab();

export const useApp = create<AppState>()(
  persist(
    (set) => ({
      tabs: [INITIAL_TAB],
      activeTabId: INITIAL_TAB.id,
      activeToolId: DEFAULT_TOOL_ID,
      paletteOpen: false,
      seed: null,
      seedNonce: 0,
      pinned: [],
      recents: [],
      pinnedCollapsed: false,
      recentCollapsed: false,
      tabState: {},
      setActiveTool: (id) =>
        set((state) => ({
          tabs: state.tabs.map((tab) =>
            tab.id === state.activeTabId ? { ...tab, toolId: id } : tab,
          ),
          activeToolId: id,
          paletteOpen: false,
          recents: recordRecent(state.recents, id),
        })),
      setPaletteOpen: (paletteOpen) => set({ paletteOpen }),
      togglePalette: () => set((state) => ({ paletteOpen: !state.paletteOpen })),
      openToolWithSeed: (id, value, mode) =>
        set((state) => ({
          tabs: state.tabs.map((tab) =>
            tab.id === state.activeTabId ? { ...tab, toolId: id } : tab,
          ),
          activeToolId: id,
          paletteOpen: false,
          seed: { value, mode },
          seedNonce: state.seedNonce + 1,
          recents: recordRecent(state.recents, id),
        })),
      openInNewTab: (id) =>
        set((state) => {
          const tab: Tab = { id: newTabId(), toolId: id };
          return {
            tabs: [...state.tabs, tab],
            activeTabId: tab.id,
            activeToolId: id,
            paletteOpen: false,
            recents: recordRecent(state.recents, id),
          };
        }),
      setActiveTab: (tabId) =>
        set((state) => {
          const tab = state.tabs.find((t) => t.id === tabId);
          if (!tab) return {};
          return { activeTabId: tabId, activeToolId: tab.toolId };
        }),
      closeTab: (tabId) =>
        set((state) => {
          const index = state.tabs.findIndex((t) => t.id === tabId);
          if (index === -1) return {};
          const tabs = state.tabs.filter((t) => t.id !== tabId);
          const { [tabId]: _removed, ...tabState } = state.tabState;

          if (tabs.length === 0) {
            const main = makeMainTab();
            return {
              tabs: [main],
              activeTabId: main.id,
              activeToolId: main.toolId,
              tabState,
            };
          }
          if (tabId !== state.activeTabId) {
            return { tabs, tabState };
          }
          // Closing the active tab: activate the neighbour at the same index.
          const neighbour = tabs[Math.min(index, tabs.length - 1)];
          return {
            tabs,
            tabState,
            activeTabId: neighbour.id,
            activeToolId: neighbour.toolId,
          };
        }),
      togglePinned: (id) =>
        set((state) => {
          const isPinned = state.pinned.includes(id);
          const pinned = isPinned
            ? state.pinned.filter((existing) => existing !== id)
            : [...state.pinned, id];
          // Auto-collapse Recent the moment the first tool is pinned, and
          // re-expand it once the last pin is removed.
          let recentCollapsed = state.recentCollapsed;
          if (!isPinned && state.pinned.length === 0) recentCollapsed = true;
          if (isPinned && pinned.length === 0) recentCollapsed = false;
          return { pinned, recentCollapsed };
        }),
      setPinnedCollapsed: (pinnedCollapsed) => set({ pinnedCollapsed }),
      setRecentCollapsed: (recentCollapsed) => set({ recentCollapsed }),
      setTabField: (tabId, field, value) =>
        set((state) => ({
          tabState: {
            ...state.tabState,
            [tabId]: { ...state.tabState[tabId], [field]: value },
          },
        })),
    }),
    {
      name: "hexkit:app",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        tabs: state.tabs,
        activeTabId: state.activeTabId,
        tabState: state.tabState,
        pinned: state.pinned,
        recents: state.recents,
        pinnedCollapsed: state.pinnedCollapsed,
        recentCollapsed: state.recentCollapsed,
      }),
      // Recompute the derived activeToolId from the restored tabs, and guarantee
      // at least one tab even if older storage had none.
      merge: (persisted, current) => {
        const merged = { ...current, ...(persisted as Partial<AppState>) };
        const tabs = merged.tabs && merged.tabs.length ? merged.tabs : current.tabs;
        const active =
          tabs.find((t) => t.id === merged.activeTabId) ?? tabs[0];
        return {
          ...merged,
          tabs,
          activeTabId: active.id,
          activeToolId: active.toolId,
        };
      },
    },
  ),
);
