import { useCallback, useState } from "react";
import { ExternalLink, RefreshCw, X, CheckCircle2, AlertTriangle, Info } from "lucide-react";
import { toast } from "sonner";
import { checkForUpdate, type UpdateCheckResult } from "../../lib/updateCheck";
import {
  APP_VERSION,
  GITHUB_URL,
  RELEASES_URL,
  openExternal,
} from "../../lib/version";
import { useTauriEvent } from "../../lib/useTauriEvent";
import { useUpdate } from "../../store/update";

type CheckState =
  | { phase: "idle" }
  | { phase: "checking" }
  | { phase: "result"; result: UpdateCheckResult }
  | { phase: "error"; message: string };

/**
 * Listens for the "Check for Updates…" menu item, fetches the latest GitHub
 * release, and surfaces the result as a toast (already up to date / no
 * releases yet) or a modal (update available / fetch failed / repo missing).
 */
export function UpdateCheckManager() {
  const [state, setState] = useState<CheckState>({ phase: "idle" });
  const setResult = useUpdate((s) => s.setResult);

  const runCheck = useCallback(async () => {
    setState({ phase: "checking" });
    try {
      const result = await checkForUpdate();
      setResult(result);
      // Toast for the silent cases; modal only when there's something to act on.
      if (result.kind === "up-to-date") {
        toast.success(`Hexkit ${APP_VERSION} is up to date`);
        setState({ phase: "idle" });
        return;
      }
      if (result.kind === "no-releases") {
        toast.info(
          `No releases published yet — you're on v${APP_VERSION}.`,
          {
            action: {
              label: "Open repo",
              onClick: () => void openExternal(RELEASES_URL),
            },
          },
        );
        setState({ phase: "idle" });
        return;
      }
      setState({ phase: "result", result });
    } catch (err) {
      setState({
        phase: "error",
        message: err instanceof Error ? err.message : String(err),
      });
    }
  }, [setResult]);

  useTauriEvent("app:check-update", () => void runCheck(), [runCheck]);

  if (state.phase === "idle" || state.phase === "checking") return null;
  return (
    <UpdateDialog
      state={state}
      onClose={() => setState({ phase: "idle" })}
      onRetry={() => void runCheck()}
    />
  );
}

function UpdateDialog({
  state,
  onClose,
  onRetry,
}: {
  state: Extract<CheckState, { phase: "result" | "error" }>;
  onClose: () => void;
  onRetry: () => void;
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Update check"
      className="fixed inset-0 z-50 flex items-center justify-center bg-canvas/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-[min(520px,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl shadow-black/40"
      >
        <header className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="font-display text-base font-semibold tracking-tight">
            {headerFor(state)}
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
        <div className="space-y-4 px-5 py-5 text-sm">
          {state.phase === "result" ? (
            <ResultBody result={state.result} onClose={onClose} />
          ) : (
            <ErrorBody message={state.message} onRetry={onRetry} />
          )}
        </div>
      </div>
    </div>
  );
}

function headerFor(state: Extract<CheckState, { phase: "result" | "error" }>): string {
  if (state.phase === "error") return "Couldn't check for updates";
  switch (state.result.kind) {
    case "update-available":
      return "Update available";
    case "repo-not-found":
      return "Couldn't find the Hexkit repo";
    case "up-to-date":
      return "Up to date";
    case "no-releases":
      return "No releases yet";
  }
}

function ResultBody({
  result,
  onClose,
}: {
  result: UpdateCheckResult;
  onClose: () => void;
}) {
  if (result.kind === "repo-not-found") {
    return (
      <>
        <p className="flex items-center gap-2 text-[oklch(70%_0.16_25)]">
          <AlertTriangle className="size-4" />
          GitHub returned 404 for the configured repository. Either the repo
          hasn't been published yet, or the URL baked into the app is wrong.
        </p>
        <p className="font-mono text-xs text-fg-muted">{GITHUB_URL}</p>
        <button
          type="button"
          onClick={() => {
            void openExternal(GITHUB_URL);
            onClose();
          }}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3.5 py-2 text-sm text-fg-muted transition-colors hover:border-border-strong hover:text-fg"
        >
          <ExternalLink className="size-4" />
          Open in browser
        </button>
      </>
    );
  }
  if (result.kind === "no-releases") {
    return (
      <p className="flex items-center gap-2 text-fg-muted">
        <Info className="size-4 text-accent" />
        Hexkit hasn't published a release yet. You're running{" "}
        <span className="font-mono text-fg">v{result.current}</span>.
      </p>
    );
  }
  if (result.kind === "up-to-date") {
    return (
      <p className="flex items-center gap-2 text-[oklch(82%_0.13_150)]">
        <CheckCircle2 className="size-4" />
        You're on the latest release ({result.current}).
      </p>
    );
  }
  return (
    <>
      <p className="flex items-center gap-2 text-fg">
        <AlertTriangle className="size-4 text-accent" />
        Version <span className="font-mono">{result.latest}</span> is available
        (you're on <span className="font-mono">{result.current}</span>).
      </p>
      {result.body && (
        <pre className="max-h-48 overflow-auto rounded-md bg-surface-2 px-3 py-2 font-mono text-[11px] text-fg-muted">
          {result.body.trim()}
        </pre>
      )}
      <div className="flex flex-wrap gap-2">
        {result.releaseUrl && (
          <button
            type="button"
            onClick={() => {
              void openExternal(result.releaseUrl!);
              onClose();
            }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3.5 py-2 text-sm font-medium text-accent-fg transition-colors hover:bg-accent-hover"
          >
            <ExternalLink className="size-4" />
            Open release page
          </button>
        )}
        <button
          type="button"
          onClick={() => {
            void openExternal(RELEASES_URL);
            onClose();
          }}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3.5 py-2 text-sm text-fg-muted transition-colors hover:border-border-strong hover:text-fg"
        >
          All releases
        </button>
      </div>
    </>
  );
}

function ErrorBody({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <>
      <p className="text-[oklch(70%_0.16_25)]">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3.5 py-2 text-sm text-fg-muted transition-colors hover:border-border-strong hover:text-fg"
      >
        <RefreshCw className="size-4" />
        Try again
      </button>
    </>
  );
}
