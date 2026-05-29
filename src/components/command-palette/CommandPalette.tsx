import { useEffect } from "react";
import { Command } from "cmdk";
import { Search } from "lucide-react";
import { useApp } from "../../store/app";
import { TOOLS } from "../../tools/registry";
import { CATEGORY_ORDER } from "../../tools/types";
import { cn } from "../../lib/cn";

export function CommandPalette() {
  const open = useApp((s) => s.paletteOpen);
  const setOpen = useApp((s) => s.setPaletteOpen);
  const setActiveTool = useApp((s) => s.setActiveTool);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, setOpen]);

  if (!open) return null;

  const groups = CATEGORY_ORDER.map((category) => ({
    category,
    tools: TOOLS.filter((tool) => tool.category === category),
  })).filter((group) => group.tools.length > 0);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-[12vh]"
      onMouseDown={() => setOpen(false)}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <Command
        label="Search tools"
        className={cn(
          "relative w-full max-w-xl overflow-hidden rounded-xl border border-border-strong",
          "bg-surface shadow-2xl shadow-black/30",
        )}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2.5 border-b border-border px-4">
          <Search className="size-4 text-fg-subtle" />
          <Command.Input
            autoFocus
            placeholder="Search tools…"
            className="h-12 w-full bg-transparent text-sm text-fg outline-none placeholder:text-fg-subtle"
          />
        </div>
        <Command.List className="max-h-[50vh] overflow-y-auto p-2">
          <Command.Empty className="px-3 py-8 text-center text-sm text-fg-subtle">
            No tools found.
          </Command.Empty>
          {groups.map(({ category, tools }) => (
            <Command.Group
              key={category}
              heading={category}
              className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-fg-subtle"
            >
              {tools.map((tool) => {
                const Icon = tool.icon;
                return (
                  <Command.Item
                    key={tool.id}
                    value={tool.name}
                    keywords={tool.keywords}
                    onSelect={() => setActiveTool(tool.id)}
                    className={cn(
                      "flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 text-sm text-fg",
                      "data-[selected=true]:bg-accent data-[selected=true]:text-accent-fg",
                    )}
                  >
                    <Icon className="size-4 opacity-80" />
                    <span className="flex-1 truncate">{tool.name}</span>
                    <span className="text-xs text-fg-subtle data-[selected=true]:text-accent-fg/80">
                      {tool.category}
                    </span>
                  </Command.Item>
                );
              })}
            </Command.Group>
          ))}
        </Command.List>
      </Command>
    </div>
  );
}
