import { X, Plus } from "lucide-react";
import { useApp } from "../../store/app";
import { getTool, DEFAULT_TOOL_ID } from "../../tools/registry";
import { cn } from "../../lib/cn";

export function TabBar() {
  const tabs = useApp((s) => s.tabs);
  const activeTabId = useApp((s) => s.activeTabId);
  const setActiveTab = useApp((s) => s.setActiveTab);
  const closeTab = useApp((s) => s.closeTab);
  const openInNewTab = useApp((s) => s.openInNewTab);

  // The bar only appears once a second tab exists, keeping the default clean.
  if (tabs.length <= 1) return null;

  return (
    <div
      role="tablist"
      aria-label="Open tabs"
      className="flex shrink-0 items-center gap-1 overflow-x-auto border-b border-border bg-surface px-2 py-1"
    >
      {tabs.map((tab) => {
        const tool = getTool(tab.toolId);
        const name = tool?.name ?? tab.toolId;
        const Icon = tool?.icon;
        const active = tab.id === activeTabId;
        return (
          <div
            key={tab.id}
            className={cn(
              "group flex shrink-0 items-center gap-1 rounded-lg border pl-2.5 pr-1 text-sm transition-colors",
              active
                ? "border-border-strong bg-canvas text-fg"
                : "border-transparent text-fg-muted hover:bg-surface-2 hover:text-fg",
            )}
          >
            <button
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-2 py-1.5"
            >
              {Icon && <Icon className="size-3.5 shrink-0 text-fg-subtle" />}
              <span className="max-w-[14ch] truncate">{name}</span>
            </button>
            <button
              type="button"
              aria-label={`Close ${name}`}
              title="Close tab"
              onClick={() => closeTab(tab.id)}
              className="rounded p-0.5 text-fg-subtle opacity-0 transition-opacity hover:text-fg group-hover:opacity-100"
            >
              <X className="size-3.5" />
            </button>
          </div>
        );
      })}
      <button
        type="button"
        aria-label="New tab"
        title="New tab"
        onClick={() => openInNewTab(DEFAULT_TOOL_ID)}
        className="shrink-0 rounded-lg p-1.5 text-fg-subtle transition-colors hover:bg-surface-2 hover:text-fg"
      >
        <Plus className="size-4" />
      </button>
    </div>
  );
}
