import { Plus, Trash2 } from "lucide-react";
import { cn } from "../../lib/cn";
import { addRow, emptyParam, removeRow, updateRow } from "./run";
import type { Param } from "./types";

interface KeyValueEditorProps {
  rows: Param[];
  onChange: (rows: Param[]) => void;
  keyPlaceholder?: string;
  valuePlaceholder?: string;
  /** Accessible label prefix, e.g. "Header" → "Header key 1". */
  label: string;
}

/**
 * An editable table of enabled/disabled key-value rows — the shared building
 * block for the request's query params, headers, and form fields.
 */
export function KeyValueEditor({
  rows,
  onChange,
  keyPlaceholder = "Key",
  valuePlaceholder = "Value",
  label,
}: KeyValueEditorProps) {
  // Always show at least one row so the editor is never an empty void.
  const display = rows.length === 0 ? [emptyParam()] : rows;

  function set(index: number, patch: Partial<Param>) {
    const base = rows.length === 0 ? [emptyParam()] : rows;
    onChange(updateRow(base, index, patch));
  }

  return (
    <div className="flex flex-col gap-1.5">
      {display.map((row, i) => (
        <div key={i} className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={row.enabled}
            onChange={(e) => set(i, { enabled: e.currentTarget.checked })}
            aria-label={`${label} ${i + 1} enabled`}
            className="size-3.5 shrink-0 accent-[var(--accent)]"
          />
          <input
            type="text"
            value={row.key}
            onChange={(e) => set(i, { key: e.currentTarget.value })}
            placeholder={keyPlaceholder}
            aria-label={`${label} key ${i + 1}`}
            className={cn(
              "h-9 w-2/5 rounded-lg border border-border bg-surface px-2.5 font-mono text-xs text-fg outline-none",
              "placeholder:text-fg-subtle focus:border-border-strong",
              !row.enabled && "opacity-50",
            )}
          />
          <input
            type="text"
            value={row.value}
            onChange={(e) => set(i, { value: e.currentTarget.value })}
            placeholder={valuePlaceholder}
            aria-label={`${label} value ${i + 1}`}
            className={cn(
              "h-9 min-w-0 flex-1 rounded-lg border border-border bg-surface px-2.5 font-mono text-xs text-fg outline-none",
              "placeholder:text-fg-subtle focus:border-border-strong",
              !row.enabled && "opacity-50",
            )}
          />
          <button
            type="button"
            onClick={() => onChange(removeRow(display, i))}
            aria-label={`Remove ${label} ${i + 1}`}
            title="Remove row"
            className="shrink-0 rounded-md p-1.5 text-fg-subtle transition-colors hover:bg-surface-2 hover:text-accent"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange(addRow(display))}
        className="mt-1 inline-flex w-fit items-center gap-1.5 rounded-lg border border-border px-2.5 py-1 text-xs text-fg-muted transition-colors hover:border-border-strong hover:text-fg"
      >
        <Plus className="size-3.5" />
        Add row
      </button>
    </div>
  );
}
