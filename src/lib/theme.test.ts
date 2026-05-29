import { describe, it, expect, vi } from "vitest";

/** Fresh import of the theme store with controlled storage + system preference. */
function loadTheme(opts: { stored?: string; systemDark?: boolean } = {}) {
  localStorage.clear();
  if (opts.stored) localStorage.setItem("hexkit.theme", opts.stored);
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: Boolean(opts.systemDark),
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
  document.documentElement.classList.remove("dark");
  vi.resetModules();
  return import("./theme");
}

describe("useTheme", () => {
  it("defaults to system and resolves light when the OS is light", async () => {
    const { useTheme } = await loadTheme({ systemDark: false });
    expect(useTheme.getState().mode).toBe("system");
    expect(useTheme.getState().resolved).toBe("light");
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });

  it("resolves dark when the OS prefers dark", async () => {
    const { useTheme } = await loadTheme({ systemDark: true });
    expect(useTheme.getState().resolved).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("honours a stored explicit mode over the system setting", async () => {
    const { useTheme } = await loadTheme({ stored: "dark", systemDark: false });
    expect(useTheme.getState().mode).toBe("dark");
    expect(useTheme.getState().resolved).toBe("dark");
  });

  it("setMode persists the choice and toggles the .dark class", async () => {
    const { useTheme } = await loadTheme({ systemDark: false });
    useTheme.getState().setMode("dark");
    expect(localStorage.getItem("hexkit.theme")).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);

    useTheme.getState().setMode("light");
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });

  it("cycles system -> light -> dark -> system", async () => {
    const { useTheme } = await loadTheme({ systemDark: false });
    expect(useTheme.getState().mode).toBe("system");
    useTheme.getState().cycle();
    expect(useTheme.getState().mode).toBe("light");
    useTheme.getState().cycle();
    expect(useTheme.getState().mode).toBe("dark");
    useTheme.getState().cycle();
    expect(useTheme.getState().mode).toBe("system");
  });
});
