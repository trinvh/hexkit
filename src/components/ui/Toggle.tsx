import type { ReactNode } from "react";
import { cn } from "../../lib/cn";

interface ToggleProps {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}

/** A small pill toggle button used for boolean tool options. */
export function Toggle({ active, onClick, children }: ToggleProps) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors",
        active
          ? "border-accent bg-accent/12 text-fg"
          : "border-border text-fg-muted hover:text-fg",
      )}
    >
      {children}
    </button>
  );
}
