import { Hammer } from "lucide-react";
import { useApp } from "../../store/app";
import { getTool } from "../../tools/registry";
import type { ToolDefinition } from "../../tools/types";

export function ToolPane() {
  const activeToolId = useApp((s) => s.activeToolId);
  const tool = getTool(activeToolId);
  if (!tool) return null;

  const Component = tool.component;
  return (
    <div className="h-full min-h-0 overflow-auto">
      {Component ? <Component /> : <Scaffolded tool={tool} />}
    </div>
  );
}

function Scaffolded({ tool }: { tool: ToolDefinition }) {
  const Icon = tool.icon;
  return (
    <div className="flex h-full flex-col items-center justify-center gap-5 p-10 text-center">
      <div className="flex size-16 items-center justify-center rounded-2xl border border-border bg-surface text-accent">
        <Icon className="size-7" />
      </div>
      <div className="max-w-md space-y-1.5">
        <h2 className="text-lg font-semibold text-fg">{tool.name}</h2>
        <p className="text-sm text-fg-muted">{tool.description}</p>
      </div>
      <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs text-fg-subtle">
        <Hammer className="size-3.5" />
        Wired up in the next phase
      </div>
    </div>
  );
}
