import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { LucideIcon } from "lucide-react";
import { cn } from "../../lib/cn";

export interface MenuItem {
  label: string;
  icon?: LucideIcon;
  onSelect: () => void;
  danger?: boolean;
}

interface MenuProps {
  /** Preferred left edge of the menu, in viewport coordinates. */
  x: number;
  /** Preferred top edge of the menu, in viewport coordinates. */
  y: number;
  items: MenuItem[];
  onClose: () => void;
}

const VIEWPORT_MARGIN = 8;

/** A lightweight portal menu used for right-click and dropdown triggers. */
export function Menu({ x, y, items, onClose }: MenuProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ left: x, top: y });

  // Keep the menu inside the viewport once its size is known.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    let left = x;
    let top = y;
    if (left + rect.width > window.innerWidth - VIEWPORT_MARGIN) {
      left = window.innerWidth - rect.width - VIEWPORT_MARGIN;
    }
    if (top + rect.height > window.innerHeight - VIEWPORT_MARGIN) {
      top = window.innerHeight - rect.height - VIEWPORT_MARGIN;
    }
    setPos({
      left: Math.max(VIEWPORT_MARGIN, left),
      top: Math.max(VIEWPORT_MARGIN, top),
    });
  }, [x, y]);

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        onClose();
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  return createPortal(
    <div
      ref={ref}
      role="menu"
      style={{ position: "fixed", left: pos.left, top: pos.top }}
      className="z-50 min-w-44 overflow-hidden rounded-lg border border-border bg-surface p-1 shadow-lg shadow-black/20"
    >
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <button
            key={item.label}
            type="button"
            role="menuitem"
            onClick={() => {
              item.onSelect();
              onClose();
            }}
            className={cn(
              "flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-left text-sm transition-colors",
              item.danger
                ? "text-red-600 hover:bg-red-500/10 dark:text-red-400"
                : "text-fg-muted hover:bg-surface-2 hover:text-fg",
            )}
          >
            {Icon && <Icon className="size-4 shrink-0 text-fg-subtle" />}
            <span className="truncate">{item.label}</span>
          </button>
        );
      })}
    </div>,
    document.body,
  );
}
