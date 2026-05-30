import { useMemo, useState, type MouseEvent, type ReactNode } from "react";
import { Search, ChevronDown, ChevronRight, MoreHorizontal, X } from "lucide-react";
import { useApp } from "../../store/app";
import { TOOLS, getTool } from "../../tools/registry";
import { CATEGORY_ORDER, type ToolDefinition } from "../../tools/types";
import { cn } from "../../lib/cn";
import { Menu, type MenuItem } from "../ui/Menu";
import { pinMenuItems } from "../../lib/toolMenu";
import { SidebarFooter } from "./SidebarFooter";

const RECENT_VISIBLE = 3;

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

interface ToolRowProps {
  tool: ToolDefinition;
  active: boolean;
  onSelect: () => void;
  onContextMenu: (event: MouseEvent) => void;
}

function ToolRow({ tool, active, onSelect, onContextMenu }: ToolRowProps) {
  const Icon = tool.icon;
  return (
    <button
      type="button"
      onClick={onSelect}
      onContextMenu={onContextMenu}
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
          active ? "text-accent" : "text-fg-subtle group-hover:text-fg-muted",
        )}
      />
      <span className="truncate">{tool.name}</span>
    </button>
  );
}

interface SectionProps {
  title: string;
  collapsed: boolean;
  onToggle: () => void;
  action?: ReactNode;
  children: ReactNode;
}

function Section({ title, collapsed, onToggle, action, children }: SectionProps) {
  const Chevron = collapsed ? ChevronRight : ChevronDown;
  return (
    <div className="px-3">
      <div className="flex items-center">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={!collapsed}
          className="flex flex-1 items-center gap-1 rounded px-2 py-1.5 text-[11px] font-medium uppercase tracking-wider text-fg-subtle transition-colors hover:text-fg-muted"
        >
          <Chevron className="size-3 shrink-0" />
          {title}
        </button>
        {action}
      </div>
      {!collapsed && <div className="pb-1">{children}</div>}
    </div>
  );
}

type MenuState = { x: number; y: number; items: MenuItem[] };

export function Sidebar() {
  const [query, setQuery] = useState("");
  const [menu, setMenu] = useState<MenuState | null>(null);

  const activeToolId = useApp((s) => s.activeToolId);
  const setActiveTool = useApp((s) => s.setActiveTool);
  const openInNewTab = useApp((s) => s.openInNewTab);
  const pinned = useApp((s) => s.pinned);
  const recents = useApp((s) => s.recents);
  const togglePinned = useApp((s) => s.togglePinned);
  const pinnedCollapsed = useApp((s) => s.pinnedCollapsed);
  const recentCollapsed = useApp((s) => s.recentCollapsed);
  const setPinnedCollapsed = useApp((s) => s.setPinnedCollapsed);
  const setRecentCollapsed = useApp((s) => s.setRecentCollapsed);

  const pinnedTools = useMemo(
    () =>
      pinned
        .map(getTool)
        .filter((tool): tool is ToolDefinition => Boolean(tool)),
    [pinned],
  );
  // Recents excluding pinned tools, so the two sections never duplicate.
  const recentTools = useMemo(
    () =>
      recents
        .filter((id) => !pinned.includes(id))
        .map(getTool)
        .filter((tool): tool is ToolDefinition => Boolean(tool)),
    [recents, pinned],
  );

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

  function openToolMenu(event: MouseEvent, id: string) {
    event.preventDefault();
    setMenu({
      x: event.clientX,
      y: event.clientY,
      items: pinMenuItems(id, pinned, togglePinned, openInNewTab),
    });
  }

  function openRecentMenu(event: MouseEvent) {
    const rect = event.currentTarget.getBoundingClientRect();
    setMenu({
      x: rect.right + 6,
      y: rect.top,
      items: recentTools.map((tool) => ({
        label: tool.name,
        icon: tool.icon,
        onSelect: () => setActiveTool(tool.id),
      })),
    });
  }

  return (
    <aside className="flex h-full w-[264px] shrink-0 flex-col border-r border-border bg-surface">
      <div className="flex h-14 shrink-0 items-center gap-2.5 px-5">
        <HexMark />
        <span className="text-[15px] font-semibold tracking-tight text-fg">
          Hexkit
        </span>
      </div>

      {pinnedTools.length > 0 && (
        <Section
          title="Pinned"
          collapsed={pinnedCollapsed}
          onToggle={() => setPinnedCollapsed(!pinnedCollapsed)}
        >
          {pinnedTools.map((tool) => (
            <ToolRow
              key={tool.id}
              tool={tool}
              active={tool.id === activeToolId}
              onSelect={() => setActiveTool(tool.id)}
              onContextMenu={(event) => openToolMenu(event, tool.id)}
            />
          ))}
        </Section>
      )}

      {recentTools.length > 0 && (
        <Section
          title="Recent"
          collapsed={recentCollapsed}
          onToggle={() => setRecentCollapsed(!recentCollapsed)}
          action={
            recentTools.length > RECENT_VISIBLE ? (
              <button
                type="button"
                onClick={openRecentMenu}
                aria-label="Show all recent tools"
                title="Show all recent tools"
                className="mr-1 rounded p-1 text-fg-subtle transition-colors hover:bg-surface-2 hover:text-fg"
              >
                <MoreHorizontal className="size-4" />
              </button>
            ) : undefined
          }
        >
          {recentTools.slice(0, RECENT_VISIBLE).map((tool) => (
            <ToolRow
              key={tool.id}
              tool={tool}
              active={tool.id === activeToolId}
              onSelect={() => setActiveTool(tool.id)}
              onContextMenu={(event) => openToolMenu(event, tool.id)}
            />
          ))}
        </Section>
      )}

      <div className="px-3 pb-2 pt-1">
        <div className="flex items-center gap-2 rounded-lg border border-border bg-canvas px-2.5 focus-within:border-border-strong">
          <Search className="size-3.5 text-fg-subtle" />
          <input
            value={query}
            onChange={(e) => setQuery(e.currentTarget.value)}
            placeholder="Filter tools…"
            className="h-8 w-full bg-transparent text-sm text-fg outline-none placeholder:text-fg-subtle"
          />
          {query !== "" && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear filter"
              title="Clear filter"
              className="shrink-0 rounded p-0.5 text-fg-subtle transition-colors hover:text-fg"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-4">
        {groups.map(({ category, tools }) => (
          <div key={category} className="mb-3">
            <div className="px-2 py-1.5 text-[11px] font-medium uppercase tracking-wider text-fg-subtle">
              {category}
            </div>
            {tools.map((tool) => (
              <ToolRow
                key={tool.id}
                tool={tool}
                active={tool.id === activeToolId}
                onSelect={() => setActiveTool(tool.id)}
                onContextMenu={(event) => openToolMenu(event, tool.id)}
              />
            ))}
          </div>
        ))}
        {groups.length === 0 && (
          <p className="px-2 py-6 text-center text-sm text-fg-subtle">
            No tools match “{query}”.
          </p>
        )}
      </nav>

      <SidebarFooter />

      {menu && (
        <Menu
          x={menu.x}
          y={menu.y}
          items={menu.items}
          onClose={() => setMenu(null)}
        />
      )}
    </aside>
  );
}
