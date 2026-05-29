import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { DEFAULT_TOOL_ID } from "../tools/registry";

export interface ToolSeed {
  value: string;
  mode?: string;
}

/** Most recents we keep in history (a few more than we surface in the UI). */
const MAX_RECENTS = 15;

function recordRecent(recents: string[], id: string): string[] {
  return [id, ...recents.filter((existing) => existing !== id)].slice(
    0,
    MAX_RECENTS,
  );
}

interface AppState {
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
  setActiveTool: (id: string) => void;
  setPaletteOpen: (open: boolean) => void;
  togglePalette: () => void;
  /** Open a tool and prefill its primary input. */
  openToolWithSeed: (id: string, value: string, mode?: string) => void;
  /** Pin or unpin a tool. Pinning the first tool auto-collapses Recent. */
  togglePinned: (id: string) => void;
  setPinnedCollapsed: (collapsed: boolean) => void;
  setRecentCollapsed: (collapsed: boolean) => void;
}

export const useApp = create<AppState>()(
  persist(
    (set) => ({
      activeToolId: DEFAULT_TOOL_ID,
      paletteOpen: false,
      seed: null,
      seedNonce: 0,
      pinned: [],
      recents: [],
      pinnedCollapsed: false,
      recentCollapsed: false,
      setActiveTool: (activeToolId) =>
        set((state) => ({
          activeToolId,
          paletteOpen: false,
          recents: recordRecent(state.recents, activeToolId),
        })),
      setPaletteOpen: (paletteOpen) => set({ paletteOpen }),
      togglePalette: () => set((state) => ({ paletteOpen: !state.paletteOpen })),
      openToolWithSeed: (activeToolId, value, mode) =>
        set((state) => ({
          activeToolId,
          paletteOpen: false,
          seed: { value, mode },
          seedNonce: state.seedNonce + 1,
          recents: recordRecent(state.recents, activeToolId),
        })),
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
    }),
    {
      name: "hexkit:app",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        pinned: state.pinned,
        recents: state.recents,
        pinnedCollapsed: state.pinnedCollapsed,
        recentCollapsed: state.recentCollapsed,
      }),
    },
  ),
);
