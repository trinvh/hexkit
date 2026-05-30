import { useState } from "react";
import { Copy, ExternalLink, X } from "lucide-react";
import {
  APP_IDENTIFIER,
  APP_NAME,
  APP_VERSION,
  FEEDBACK_URL,
  GITHUB_URL,
  LICENSE_NAME,
  openExternal,
} from "../../lib/version";
import { useTauriEvent } from "../../lib/useTauriEvent";

/**
 * Listens for the "App Information…" menu item and renders a small modal
 * with the app's identity, links to the repo and the license.
 */
export function AppInfoManager() {
  const [open, setOpen] = useState(false);

  useTauriEvent("app:show-info", () => setOpen(true));

  if (!open) return null;
  return <AppInfoDialog onClose={() => setOpen(false)} />;
}

function AppInfoDialog({ onClose }: { onClose: () => void }) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="About Hexkit"
      className="fixed inset-0 z-50 flex items-center justify-center bg-canvas/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-[min(440px,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl shadow-black/40"
      >
        <header className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="font-display text-base font-semibold tracking-tight">
            App Information
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-fg-muted transition-colors hover:text-fg"
          >
            <X className="size-4" />
          </button>
        </header>
        <div className="space-y-4 px-5 py-5">
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
            <dt className="text-fg-muted">Name</dt>
            <dd className="text-fg">{APP_NAME}</dd>
            <dt className="text-fg-muted">Version</dt>
            <dd className="font-mono text-fg">{APP_VERSION}</dd>
            <dt className="text-fg-muted">Identifier</dt>
            <dd className="font-mono text-fg">{APP_IDENTIFIER}</dd>
            <dt className="text-fg-muted">License</dt>
            <dd className="text-fg">{LICENSE_NAME}</dd>
            <dt className="text-fg-muted">Platform</dt>
            <dd className="font-mono text-fg">{navigator.platform}</dd>
          </dl>
          <div className="flex flex-wrap gap-2 pt-2">
            <LinkButton href={GITHUB_URL} label="GitHub repository" />
            <LinkButton href={FEEDBACK_URL} label="Report an issue" />
            <CopyButton text={`${APP_NAME} ${APP_VERSION} (${APP_IDENTIFIER})`} />
          </div>
        </div>
      </div>
    </div>
  );
}

function LinkButton({ href, label }: { href: string; label: string }) {
  return (
    <button
      type="button"
      onClick={() => void openExternal(href)}
      className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-fg-muted transition-colors hover:border-border-strong hover:text-fg"
    >
      <ExternalLink className="size-3.5" />
      {label}
    </button>
  );
}

function CopyButton({ text }: { text: string }) {
  return (
    <button
      type="button"
      onClick={() => void navigator.clipboard?.writeText(text)}
      className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-fg-muted transition-colors hover:border-border-strong hover:text-fg"
    >
      <Copy className="size-3.5" />
      Copy version info
    </button>
  );
}
