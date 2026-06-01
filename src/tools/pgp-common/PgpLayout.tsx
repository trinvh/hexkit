import type { ReactNode } from "react";
import { CopyButton } from "../../components/ui/CopyButton";

/**
 * Shared layout for the seven PGP tools: a heading row with a Sample/Clear
 * action area on the right, then a two-column grid (form on the left,
 * output(s) on the right).
 *
 * Every PGP tool has the same shape — multiple secret/key inputs feeding a
 * single computed output — so they all share this skeleton instead of
 * hand-rolling it seven times.
 */
export interface PgpLayoutProps {
  title: string;
  /** Right-aligned action buttons (Sample, Clear, Generate, …). */
  actions?: ReactNode;
  /** Left-pane: the input form. */
  form: ReactNode;
  /** Right-pane: the result (or a hint to fill in the form). */
  output: ReactNode;
}

export function PgpLayout({ title, actions, form, output }: PgpLayoutProps) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-2.5">
        <span className="text-xs uppercase tracking-wider text-fg-subtle">{title}</span>
        <div className="flex items-center gap-2">{actions}</div>
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-2 divide-x divide-border">
        <div className="min-h-0 overflow-auto p-4">{form}</div>
        <div className="min-h-0 overflow-auto p-4">{output}</div>
      </div>
    </div>
  );
}

/** A labeled textarea block used by every PGP tool. */
export interface KeyAreaProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  /** Vertical height in Tailwind classes — defaults to `h-40`. */
  heightClass?: string;
  ariaLabel?: string;
}

export function KeyArea({
  label,
  value,
  onChange,
  placeholder,
  heightClass = "h-40",
  ariaLabel,
}: KeyAreaProps) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium uppercase tracking-wider text-fg-subtle">
        {label}
      </span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel ?? label}
        spellCheck={false}
        className={
          "w-full resize-y rounded-lg border border-border bg-surface px-3 py-2 font-mono text-xs text-fg outline-none focus:border-border-strong " +
          heightClass
        }
      />
    </label>
  );
}

/** Output block with a copy button. */
export function OutputBlock({
  label,
  value,
  monospace = true,
}: {
  label: string;
  value: string;
  monospace?: boolean;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface">
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <span className="text-xs font-medium uppercase tracking-wider text-fg-subtle">
          {label}
        </span>
        <CopyButton value={value} label="" />
      </div>
      <pre
        className={
          "max-h-72 overflow-auto whitespace-pre-wrap break-all px-3 py-2 text-xs text-fg " +
          (monospace ? "font-mono" : "")
        }
      >
        {value}
      </pre>
    </div>
  );
}

export function ErrorBox({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-border-strong bg-surface px-4 py-3 text-sm">
      <span className="font-medium text-accent">Error</span>
      <span className="ml-2 text-fg-muted">{message}</span>
    </div>
  );
}

export function Placeholder({ children }: { children: ReactNode }) {
  return <p className="text-sm text-fg-subtle">{children}</p>;
}
