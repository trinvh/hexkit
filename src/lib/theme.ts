import { create } from "zustand";

export type ThemeMode = "system" | "light" | "dark";
export type ResolvedTheme = "light" | "dark";

interface ThemeState {
  mode: ThemeMode;
  resolved: ResolvedTheme;
  setMode: (mode: ThemeMode) => void;
  cycle: () => void;
}

const STORAGE_KEY = "hexkit.theme";
const MODES: ThemeMode[] = ["system", "light", "dark"];

function readStoredMode(): ThemeMode {
  const value = localStorage.getItem(STORAGE_KEY);
  return value === "light" || value === "dark" || value === "system"
    ? value
    : "system";
}

function prefersDark(): boolean {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function resolveTheme(mode: ThemeMode): ResolvedTheme {
  if (mode === "system") return prefersDark() ? "dark" : "light";
  return mode;
}

function applyTheme(resolved: ResolvedTheme): void {
  document.documentElement.classList.toggle("dark", resolved === "dark");
}

export const useTheme = create<ThemeState>()((set, get) => {
  const initialMode = readStoredMode();
  const initialResolved = resolveTheme(initialMode);
  applyTheme(initialResolved);

  window
    .matchMedia("(prefers-color-scheme: dark)")
    .addEventListener("change", () => {
      if (get().mode !== "system") return;
      const resolved = resolveTheme("system");
      applyTheme(resolved);
      set({ resolved });
    });

  return {
    mode: initialMode,
    resolved: initialResolved,
    setMode: (mode) => {
      localStorage.setItem(STORAGE_KEY, mode);
      const resolved = resolveTheme(mode);
      applyTheme(resolved);
      set({ mode, resolved });
    },
    cycle: () => {
      const next = MODES[(MODES.indexOf(get().mode) + 1) % MODES.length];
      get().setMode(next);
    },
  };
});
