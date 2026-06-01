import { useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useApp } from "../../store/app";
import { isTauri } from "../../lib/cli";
import { useTauriEvent } from "../../lib/useTauriEvent";

/**
 * Bridges the native View menu to the layout store.
 *
 * The Rust menu emits `view:toggle-*` events when the user picks "Show Sidebar"
 * or "Show Header Bar"; we flip the corresponding store flag here. The store is
 * the source of truth (it's persisted), so whenever a flag changes — including
 * on first mount with the restored value — we push the authoritative checked
 * state back to the menu so its checkmarks always match what's on screen.
 *
 * Renders nothing; no-ops outside Tauri (browser preview has no native menu).
 */
export function ViewMenuManager() {
  const sidebarVisible = useApp((s) => s.sidebarVisible);
  const headerVisible = useApp((s) => s.headerVisible);
  const toggleSidebar = useApp((s) => s.toggleSidebar);
  const toggleHeader = useApp((s) => s.toggleHeader);

  useTauriEvent("view:toggle-sidebar", () => toggleSidebar(), [toggleSidebar]);
  useTauriEvent("view:toggle-header", () => toggleHeader(), [toggleHeader]);

  useEffect(() => {
    if (!isTauri()) return;
    void invoke("set_view_menu_state", {
      sidebarVisible,
      headerVisible,
    }).catch(() => {
      // The menu may not be built yet on the very first paint; the next
      // state change re-syncs, and startup order makes this rare.
    });
  }, [sidebarVisible, headerVisible]);

  return null;
}
