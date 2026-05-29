import type { ReactNode } from "react";
import { ResultList, type ResultRow } from "./ResultList";

interface ResultLayoutProps {
  /** Input controls (fields, selectors) shown at the top. */
  header: ReactNode;
  /** Result rows, or `null` when there is no input yet. */
  rows: ResultRow[] | null;
  error: string | null;
  errorTitle?: string;
  emptyHint?: string;
}

/** Shared layout for tools that turn one input into a list of labelled values. */
export function ResultLayout({
  header,
  rows,
  error,
  errorTitle = "Error",
  emptyHint = "Enter input to see results.",
}: ResultLayoutProps) {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border p-4">{header}</div>
      <div className="min-h-0 flex-1 overflow-auto p-4">
        {error ? (
          <div className="rounded-lg border border-border-strong bg-surface px-4 py-3 text-sm">
            <span className="font-medium text-accent">{errorTitle}</span>
            <span className="ml-2 text-fg-muted">{error}</span>
          </div>
        ) : rows ? (
          <div className="overflow-hidden rounded-xl border border-border bg-surface">
            <ResultList rows={rows} />
          </div>
        ) : (
          <p className="px-1 text-sm text-fg-subtle">{emptyHint}</p>
        )}
      </div>
    </div>
  );
}
