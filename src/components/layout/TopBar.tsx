import { Search } from "lucide-react";
import { useApp } from "../../store/app";
import { getTool } from "../../tools/registry";
import { ThemeToggle } from "../ui/ThemeToggle";
import { cn } from "../../lib/cn";

export function TopBar() {
  const activeToolId = useApp((s) => s.activeToolId);
  const togglePalette = useApp((s) => s.togglePalette);
  const tool = getTool(activeToolId);

  return (
    <header className="flex h-14 shrink-0 items-center gap-4 border-b border-border px-5">
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-sm font-semibold text-fg">{tool?.name}</h1>
        <p className="truncate text-xs text-fg-muted">{tool?.description}</p>
      </div>
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
    </header>
  );
}
