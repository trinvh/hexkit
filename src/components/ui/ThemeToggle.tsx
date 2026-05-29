import { Monitor, Sun, Moon, type LucideIcon } from "lucide-react";
import { useTheme, type ThemeMode } from "../../lib/theme";
import { cn } from "../../lib/cn";

const ICONS: Record<ThemeMode, LucideIcon> = {
  system: Monitor,
  light: Sun,
  dark: Moon,
};

const LABELS: Record<ThemeMode, string> = {
  system: "System theme",
  light: "Light theme",
  dark: "Dark theme",
};

export function ThemeToggle() {
  const mode = useTheme((s) => s.mode);
  const cycle = useTheme((s) => s.cycle);
  const Icon = ICONS[mode];

  return (
    <button
      type="button"
      onClick={cycle}
      title={`${LABELS[mode]} — click to change`}
      aria-label={`${LABELS[mode]}, click to change`}
      className={cn(
        "inline-flex size-9 items-center justify-center rounded-lg",
        "text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60",
      )}
    >
      <Icon className="size-[18px]" />
    </button>
  );
}
