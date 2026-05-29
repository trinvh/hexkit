import { create } from "zustand";
import { DEFAULT_TOOL_ID } from "../tools/registry";

export interface ToolSeed {
  value: string;
  mode?: string;
}

interface AppState {
  activeToolId: string;
  paletteOpen: boolean;
  /** Pending input to prefill into the next tool that mounts (smart detection). */
  seed: ToolSeed | null;
  /** Bumped on each seed so the active tool remounts and re-reads it. */
  seedNonce: number;
  setActiveTool: (id: string) => void;
  setPaletteOpen: (open: boolean) => void;
  togglePalette: () => void;
  /** Open a tool and prefill its primary input. */
  openToolWithSeed: (id: string, value: string, mode?: string) => void;
}

export const useApp = create<AppState>()((set) => ({
  activeToolId: DEFAULT_TOOL_ID,
  paletteOpen: false,
  seed: null,
  seedNonce: 0,
  setActiveTool: (activeToolId) => set({ activeToolId, paletteOpen: false }),
  setPaletteOpen: (paletteOpen) => set({ paletteOpen }),
  togglePalette: () => set((state) => ({ paletteOpen: !state.paletteOpen })),
  openToolWithSeed: (activeToolId, value, mode) =>
    set((state) => ({
      activeToolId,
      paletteOpen: false,
      seed: { value, mode },
      seedNonce: state.seedNonce + 1,
    })),
}));
