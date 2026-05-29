import type { ReactNode } from "react";
import { CodeEditor } from "./CodeEditor";
import { CopyButton } from "./CopyButton";

interface TransformLayoutProps {
  /** Mode controls shown on the left of the toolbar. */
  toolbar: ReactNode;
  input: string;
  onInput: (value: string) => void;
  output: string;
  error: string | null;
  loading?: boolean;
  language?: "json";
  inputLabel?: string;
  outputLabel?: string;
  inputPlaceholder?: string;
  outputPlaceholder?: string;
  errorTitle?: string;
}

/** Shared input → output layout for live, single-input transform tools. */
export function TransformLayout({
  toolbar,
  input,
  onInput,
  output,
  error,
  loading = false,
  language,
  inputLabel = "Input",
  outputLabel = "Output",
  inputPlaceholder,
  outputPlaceholder,
  errorTitle = "Error",
}: TransformLayoutProps) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-2.5">
        {toolbar}
        <div className="flex items-center gap-3">
          {loading && <span className="text-xs text-fg-subtle">working…</span>}
          <CopyButton value={output} label="Copy output" />
        </div>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-2 divide-x divide-border">
        <div className="min-h-0 overflow-hidden">
          <CodeEditor
            value={input}
            onChange={onInput}
            language={language}
            ariaLabel={inputLabel}
            placeholder={inputPlaceholder}
          />
        </div>
        <div className="relative min-h-0 overflow-hidden">
          <CodeEditor
            value={error ? "" : output}
            readOnly
            language={language}
            ariaLabel={outputLabel}
            placeholder={outputPlaceholder}
          />
          {error && (
            <div className="absolute inset-x-3 bottom-3 rounded-lg border border-border-strong bg-surface px-3 py-2 text-xs shadow-lg">
              <span className="font-medium text-accent">{errorTitle}</span>
              <span className="ml-2 text-fg-muted">{error}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
