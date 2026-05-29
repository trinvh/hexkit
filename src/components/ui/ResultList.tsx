import { CopyButton } from "./CopyButton";

export interface ResultRow {
  label: string;
  value: string;
}

/** A list of labelled, monospaced values, each independently copyable. */
export function ResultList({ rows }: { rows: ResultRow[] }) {
  return (
    <div className="divide-y divide-border">
      {rows.map((row) => (
        <div key={row.label} className="flex items-center gap-4 px-4 py-3">
          <span className="w-28 shrink-0 text-xs font-medium uppercase tracking-wider text-fg-subtle">
            {row.label}
          </span>
          <span className="min-w-0 flex-1 break-all font-mono text-sm text-fg">
            {row.value || "—"}
          </span>
          <CopyButton value={row.value} label="" />
        </div>
      ))}
    </div>
  );
}
