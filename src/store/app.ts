import { create } from "zustand";
import { DEFAULT_TOOL_ID } from "../tools/registry";

interface AppState {
  activeToolId: string;
  paletteOpen: boolean;
  setActiveTool: (id: string) => void;
  setPaletteOpen: (open: boolean) => void;
  togglePalette: () => void;
}

export const useApp = create<AppState>()((set) => ({
  activeToolId: DEFAULT_TOOL_ID,
  paletteOpen: false,
  setActiveTool: (activeToolId) => set({ activeToolId, paletteOpen: false }),
  setPaletteOpen: (paletteOpen) => set({ paletteOpen }),
  togglePalette: () => set((state) => ({ paletteOpen: !state.paletteOpen })),
}));
