import type { CliState } from "../../lib/cli";
import { cn } from "../../lib/cn";

interface CliStatusBadgeProps {
  state: CliState;
  onClick: () => void;
}

interface BadgePreset {
  dotClass: string;
  label: string;
  tooltip: string;
}

const PRESETS: Record<CliState, BadgePreset> = {
  unknown: {
    dotClass: "bg-fg-subtle/60",
    label: "CLI",
    tooltip: "CLI status is only available in the desktop app",
  },
  missing: {
    dotClass: "bg-accent",
    label: "Install CLI",
    tooltip: "The Hexkit CLI isn't installed yet",
  },
  outdated: {
    dotClass: "bg-[oklch(82%_0.16_85)]",
    label: "Update CLI",
    tooltip: "Your installed CLI is older than this app",
  },
  ok: {
    dotClass: "bg-[oklch(75%_0.15_150)]",
    label: "CLI",
    tooltip: "Hexkit CLI is installed and up to date",
  },
};

export function CliStatusBadge({ state, onClick }: CliStatusBadgeProps) {
  const preset = PRESETS[state];
  return (
    <button
      type="button"
      onClick={onClick}
      title={preset.tooltip}
      aria-label={preset.tooltip}
      className={cn(
        "inline-flex items-center gap-2 rounded-lg border border-border px-3 py-1.5",
        "text-xs text-fg-muted transition-colors hover:border-border-strong hover:text-fg",
        state === "missing" && "border-accent/40 text-accent hover:border-accent/70 hover:text-accent",
      )}
    >
      <span className={cn("size-2 rounded-full", preset.dotClass)} />
      <span>{preset.label}</span>
    </button>
  );
}
