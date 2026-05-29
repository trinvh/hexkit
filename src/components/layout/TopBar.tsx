import { useState, type MouseEvent } from "react";
import { Search, Wand2, MoreVertical } from "lucide-react";
import { useApp } from "../../store/app";
import { getTool } from "../../tools/registry";
import { detectFromClipboard } from "../../lib/detect";
import { ThemeToggle } from "../ui/ThemeToggle";
import { Menu, type MenuItem } from "../ui/Menu";
import { pinMenuItems } from "../../lib/toolMenu";
import { cn } from "../../lib/cn";

type MenuState = { x: number; y: number; items: MenuItem[] };

export function TopBar() {
  const activeToolId = useApp((s) => s.activeToolId);
  const togglePalette = useApp((s) => s.togglePalette);
  const pinned = useApp((s) => s.pinned);
  const togglePinned = useApp((s) => s.togglePinned);
  const tool = getTool(activeToolId);
  const [menu, setMenu] = useState<MenuState | null>(null);

  function openToolMenu(event: MouseEvent) {
    const rect = event.currentTarget.getBoundingClientRect();
    setMenu({
      x: rect.right,
      y: rect.bottom + 4,
      items: pinMenuItems(activeToolId, pinned, togglePinned),
    });
  }

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border px-5">
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-sm font-semibold text-fg">{tool?.name}</h1>
        <p className="truncate text-xs text-fg-muted">{tool?.description}</p>
      </div>
      <button
        type="button"
        onClick={openToolMenu}
        aria-label="Tool actions"
        title="Tool actions"
        className={cn(
          "inline-flex size-8 items-center justify-center rounded-lg border border-border",
          "text-fg-muted transition-colors hover:border-border-strong hover:text-fg",
        )}
      >
        <MoreVertical className="size-4" />
      </button>
      <button
        type="button"
        onClick={detectFromClipboard}
        title="Detect the right tool from clipboard contents"
        className={cn(
          "inline-flex items-center gap-2 rounded-lg border border-border px-3 py-1.5",
          "text-xs text-fg-muted transition-colors hover:border-border-strong hover:text-fg",
        )}
      >
        <Wand2 className="size-3.5 text-accent" />
        <span>Detect</span>
      </button>
      <button
        type="button"
        onClick={togglePalette}
        className={cn(
          "inline-flex items-center gap-2 rounded-lg border border-border px-3 py-1.5",
          "text-xs text-fg-muted transition-colors hover:border-border-strong hover:text-fg",
        )}
      >
        <Search className="size-3.5" />
        <span>Search</span>
        <kbd className="ml-1 rounded bg-surface-2 px-1.5 py-0.5 font-mono text-[10px] text-fg-subtle">
          ⌘K
        </kbd>
      </button>
      <ThemeToggle />
      {menu && (
        <Menu
          x={menu.x}
          y={menu.y}
          items={menu.items}
          onClose={() => setMenu(null)}
        />
      )}
    </header>
  );
}
