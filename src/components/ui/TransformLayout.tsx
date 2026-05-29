import type { ReactNode } from "react";
import { CodeEditor, type CodeLanguage } from "./CodeEditor";
import { CopyButton } from "./CopyButton";
import { InputActions } from "./InputActions";

interface TransformLayoutProps {
  /** Mode controls shown on the left of the toolbar. */
  toolbar: ReactNode;
  input: string;
  onInput: (value: string) => void;
  output: string;
  error: string | null;
  loading?: boolean;
  /** Syntax highlighting for both panes (shorthand for same-language tools). */
  language?: CodeLanguage;
  /** Override highlighting for the input pane. */
  inputLanguage?: CodeLanguage;
  /** Override highlighting for the output pane. */
  outputLanguage?: CodeLanguage;
  inputLabel?: string;
  outputLabel?: string;
  inputPlaceholder?: string;
  outputPlaceholder?: string;
  errorTitle?: string;
  /** Optional controls rendered in a bar beneath the output pane. */
  outputFooter?: ReactNode;
  /** When set, a "Sample" button loads this value into the input. */
  sample?: string;
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
  inputLanguage,
  outputLanguage,
  inputLabel = "Input",
  outputLabel = "Output",
  inputPlaceholder,
  outputPlaceholder,
  errorTitle = "Error",
  outputFooter,
  sample,
}: TransformLayoutProps) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-2.5">
        {toolbar}
        <div className="flex items-center gap-3">
          {loading && <span className="text-xs text-fg-subtle">working…</span>}
          <InputActions
            onInput={onInput}
            sample={sample}
            hasInput={input !== ""}
          />
          <CopyButton value={output} label="Copy output" />
        </div>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-2 divide-x divide-border">
        <div className="min-h-0 overflow-hidden">
          <CodeEditor
            value={input}
            onChange={onInput}
            language={inputLanguage ?? language}
            ariaLabel={inputLabel}
            placeholder={inputPlaceholder}
          />
        </div>
        <div className="flex min-h-0 flex-col overflow-hidden">
          <div className="relative min-h-0 flex-1 overflow-hidden">
            <CodeEditor
              value={error ? "" : output}
              readOnly
              language={outputLanguage ?? language}
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
          {outputFooter && (
            <div className="border-t border-border px-3 py-2">{outputFooter}</div>
          )}
        </div>
      </div>
    </div>
  );
}
