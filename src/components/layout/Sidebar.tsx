import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { useApp } from "../../store/app";
import { TOOLS } from "../../tools/registry";
import { CATEGORY_ORDER, type ToolDefinition } from "../../tools/types";
import { cn } from "../../lib/cn";

function HexMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-6 text-accent" aria-hidden>
      <path
        d="M12 2.5 20.5 7v10L12 21.5 3.5 17V7L12 2.5Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path
        d="M12 7.5 16 10v4l-4 2.5L8 14v-4l4-2.5Z"
        fill="currentColor"
        opacity="0.9"
      />
    </svg>
  );
}

export function Sidebar() {
  const [query, setQuery] = useState("");
  const activeToolId = useApp((s) => s.activeToolId);
  const setActiveTool = useApp((s) => s.setActiveTool);

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matches = (tool: ToolDefinition) =>
      !q ||
      tool.name.toLowerCase().includes(q) ||
      tool.keywords.some((keyword) => keyword.includes(q));
    return CATEGORY_ORDER.map((category) => ({
      category,
      tools: TOOLS.filter((tool) => tool.category === category && matches(tool)),
    })).filter((group) => group.tools.length > 0);
  }, [query]);

  return (
    <aside className="flex h-full w-[264px] shrink-0 flex-col border-r border-border bg-surface">
      <div className="flex h-14 shrink-0 items-center gap-2.5 px-5">
        <HexMark />
        <span className="text-[15px] font-semibold tracking-tight text-fg">
          Hexkit
        </span>
      </div>

      <div className="px-3 pb-2">
        <div className="flex items-center gap-2 rounded-lg border border-border bg-canvas px-2.5 focus-within:border-border-strong">
          <Search className="size-3.5 text-fg-subtle" />
          <input
            value={query}
            onChange={(e) => setQuery(e.currentTarget.value)}
            placeholder="Filter tools…"
            className="h-8 w-full bg-transparent text-sm text-fg outline-none placeholder:text-fg-subtle"
          />
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-4">
        {groups.map(({ category, tools }) => (
          <div key={category} className="mb-3">
            <div className="px-2 py-1.5 text-[11px] font-medium uppercase tracking-wider text-fg-subtle">
              {category}
            </div>
            {tools.map((tool) => {
              const Icon = tool.icon;
              const active = tool.id === activeToolId;
              return (
                <button
                  key={tool.id}
                  type="button"
                  onClick={() => setActiveTool(tool.id)}
                  className={cn(
                    "group flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left text-sm transition-colors",
                    active
                      ? "bg-accent/12 text-fg"
                      : "text-fg-muted hover:bg-surface-2 hover:text-fg",
                  )}
                >
                  <Icon
                    className={cn(
                      "size-4 shrink-0",
                      active
                        ? "text-accent"
                        : "text-fg-subtle group-hover:text-fg-muted",
                    )}
                  />
                  <span className="truncate">{tool.name}</span>
                </button>
              );
            })}
          </div>
        ))}
        {groups.length === 0 && (
          <p className="px-2 py-6 text-center text-sm text-fg-subtle">
            No tools match “{query}”.
          </p>
        )}
      </nav>
    </aside>
  );
}
