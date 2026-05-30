import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, AlertTriangle, X, Copy, Terminal, Trash2 } from "lucide-react";
import { useApp } from "../../store/app";
import { useCliStatus } from "../../lib/useCliStatus";
import {
  installCli,
  uninstallCli,
  isTauri,
  type CliStatus,
} from "../../lib/cli";
import { useTauriEvent } from "../../lib/useTauriEvent";
import { cn } from "../../lib/cn";

type InstallState =
  | { phase: "idle" }
  | { phase: "installing" }
  | { phase: "uninstalling" }
  | { phase: "done"; pathHint: string | null; installedPath: string; installDirOnPath: boolean }
  | { phase: "removed"; removedPath: string }
  | { phase: "error"; message: string };

interface CliManagerProps {
  /** Optional ref-counted open state. The TopBar badge flips this. */
  openSignal: number;
}

export function CliManager({ openSignal }: CliManagerProps) {
  const { status, state, loading, error, refresh } = useCliStatus();
  const cliPromptDismissed = useApp((s) => s.cliPromptDismissed);
  const setCliPromptDismissed = useApp((s) => s.setCliPromptDismissed);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [install, setInstall] = useState<InstallState>({ phase: "idle" });

  // Open the dialog when the parent (TopBar badge) flips its signal counter.
  useEffect(() => {
    if (openSignal > 0) setDialogOpen(true);
  }, [openSignal]);

  // Native menu items emit events; auto-open the dialog when they fire.
  useTauriEvent("cli:install-requested", () => setDialogOpen(true));
  useTauriEvent("cli:show-status", () => setDialogOpen(true));

  const closeDialog = useCallback(() => {
    setDialogOpen(false);
    setInstall({ phase: "idle" });
  }, []);

  const handleInstall = useCallback(async () => {
    setInstall({ phase: "installing" });
    try {
      const report = await installCli();
      setInstall({
        phase: "done",
        pathHint: report.pathHint,
        installedPath: report.installedPath,
        installDirOnPath: report.installDirOnPath,
      });
      await refresh();
      setCliPromptDismissed(true);
    } catch (err) {
      setInstall({
        phase: "error",
        message: err instanceof Error ? err.message : String(err),
      });
    }
  }, [refresh, setCliPromptDismissed]);

  const handleUninstall = useCallback(async () => {
    setInstall({ phase: "uninstalling" });
    try {
      const removedPath = await uninstallCli();
      setInstall({ phase: "removed", removedPath });
      await refresh();
    } catch (err) {
      setInstall({
        phase: "error",
        message: err instanceof Error ? err.message : String(err),
      });
    }
  }, [refresh]);

  const showFirstRunBanner =
    !cliPromptDismissed &&
    !loading &&
    isTauri() &&
    (state === "missing" || state === "outdated");

  return (
    <>
      {showFirstRunBanner && (
        <FirstRunBanner
          state={state}
          onInstall={() => setDialogOpen(true)}
          onDismiss={() => setCliPromptDismissed(true)}
        />
      )}
      {dialogOpen && (
        <CliDialog
          status={status}
          loading={loading}
          error={error}
          install={install}
          onInstall={handleInstall}
          onUninstall={handleUninstall}
          onClose={closeDialog}
        />
      )}
    </>
  );
}

function FirstRunBanner({
  state,
  onInstall,
  onDismiss,
}: {
  state: "missing" | "outdated";
  onInstall: () => void;
  onDismiss: () => void;
}) {
  const message =
    state === "missing"
      ? "Install the Hexkit command-line tools to use Hexkit from your shell, scripts and the Raycast extension."
      : "Your Hexkit CLI is older than this app. Update it to keep them in sync.";

  return (
    <div className="flex items-center gap-3 border-b border-accent/30 bg-accent/10 px-5 py-3 text-sm">
      <Terminal className="size-4 shrink-0 text-accent" />
      <p className="min-w-0 flex-1 text-fg">{message}</p>
      <button
        type="button"
        onClick={onInstall}
        className="rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-accent-fg transition-colors hover:bg-accent-hover"
      >
        {state === "missing" ? "Install" : "Update"}
      </button>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss"
        className="text-fg-muted transition-colors hover:text-fg"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}

function CliDialog({
  status,
  loading,
  error,
  install,
  onInstall,
  onUninstall,
  onClose,
}: {
  status: CliStatus | null;
  loading: boolean;
  error: string | null;
  install: InstallState;
  onInstall: () => void;
  onUninstall: () => void;
  onClose: () => void;
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Hexkit Command Line Tools"
      className="fixed inset-0 z-50 flex items-center justify-center bg-canvas/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-[min(480px,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl shadow-black/40"
      >
        <header className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-2">
            <Terminal className="size-4 text-accent" />
            <h2 className="font-display text-base font-semibold tracking-tight">
              Command Line Tools
            </h2>
          </div>
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
          {!isTauri() ? (
            <p className="text-fg-muted">
              The CLI integration is only available in the Hexkit desktop app.
            </p>
          ) : loading ? (
            <p className="text-fg-muted">Checking install state…</p>
          ) : error ? (
            <p className="text-[oklch(70%_0.16_25)]">{error}</p>
          ) : status ? (
            <DialogBody
              status={status}
              install={install}
              onInstall={onInstall}
              onUninstall={onUninstall}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}

function DialogBody({
  status,
  install,
  onInstall,
  onUninstall,
}: {
  status: CliStatus;
  install: InstallState;
  onInstall: () => void;
  onUninstall: () => void;
}) {
  const cliState = !status.installedPath
    ? "missing"
    : status.versionOk
      ? "ok"
      : "outdated";

  // We can only safely uninstall the copy we manage (i.e. the one at the
  // default install path). External installs (cargo, homebrew, manual) stay
  // untouched.
  const managedByUs =
    !!status.installedPath &&
    samePath(status.installedPath, status.defaultInstallPath);

  return (
    <>
      <StatusRow status={status} state={cliState} />
      <div className="flex flex-wrap gap-2">
        {cliState !== "ok" && status.bundledSidecarAvailable && (
          <button
            type="button"
            onClick={onInstall}
            disabled={install.phase === "installing" || install.phase === "uninstalling"}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2.5",
              "text-sm font-medium text-accent-fg transition-colors hover:bg-accent-hover",
              "disabled:cursor-progress disabled:opacity-60",
            )}
          >
            {install.phase === "installing"
              ? "Installing…"
              : cliState === "missing"
                ? "Install CLI"
                : "Update CLI"}
          </button>
        )}
        {managedByUs && (
          <button
            type="button"
            onClick={onUninstall}
            disabled={install.phase === "installing" || install.phase === "uninstalling"}
            className={cn(
              "inline-flex items-center justify-center gap-2 rounded-xl border border-border px-4 py-2.5",
              "text-sm font-medium text-fg-muted transition-colors hover:border-border-strong hover:text-fg",
              "disabled:cursor-progress disabled:opacity-60",
            )}
          >
            <Trash2 className="size-4" />
            {install.phase === "uninstalling" ? "Removing…" : "Uninstall"}
          </button>
        )}
      </div>
      {!status.bundledSidecarAvailable && cliState !== "ok" && (
        <p className="text-xs text-fg-muted">
          This build doesn&apos;t include the CLI sidecar. Download the
          standalone <code>hexkit</code> archive from the latest GitHub
          release and put it on your <code>PATH</code>.
        </p>
      )}

      <InstallReportRow install={install} />

      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-xs text-fg-muted">
        <dt>App version</dt>
        <dd className="font-mono text-fg">{status.appVersion}</dd>

        <dt>Installed CLI</dt>
        <dd className="font-mono text-fg">
          {status.installedVersion ?? "not installed"}
        </dd>

        {status.installedPath && (
          <>
            <dt>Path</dt>
            <dd className="truncate font-mono text-fg" title={status.installedPath}>
              {status.installedPath}
            </dd>
          </>
        )}

        <dt>Install dir</dt>
        <dd className="truncate font-mono text-fg" title={status.defaultInstallDir}>
          {status.defaultInstallDir}
        </dd>
      </dl>
    </>
  );
}

function StatusRow({
  status,
  state,
}: {
  status: CliStatus;
  state: "ok" | "outdated" | "missing";
}) {
  if (state === "ok") {
    return (
      <p className="flex items-center gap-2 text-[oklch(82%_0.13_150)]">
        <CheckCircle2 className="size-4" />
        Hexkit CLI {status.installedVersion} is installed and matches this app.
      </p>
    );
  }
  if (state === "outdated") {
    return (
      <p className="flex items-center gap-2 text-[oklch(82%_0.16_85)]">
        <AlertTriangle className="size-4" />
        Installed CLI is {status.installedVersion}, but this app expects{" "}
        {status.appVersion} or newer.
      </p>
    );
  }
  return (
    <p className="text-fg">
      The Hexkit CLI is not installed. Installing it enables shell scripts
      and the Raycast extension.
    </p>
  );
}

function InstallReportRow({ install }: { install: InstallState }) {
  if (install.phase === "done") {
    return (
      <div className="rounded-lg border border-accent/30 bg-accent/10 px-4 py-3 text-xs text-fg">
        <p className="flex items-center gap-2 text-accent">
          <CheckCircle2 className="size-4" />
          Installed at <code className="font-mono">{install.installedPath}</code>.
        </p>
        {!install.installDirOnPath && install.pathHint && (
          <div className="mt-3">
            <p className="mb-1.5 text-fg-muted">
              Add the install directory to your shell so you can run{" "}
              <code className="font-mono">hexkit</code> from anywhere:
            </p>
            <PathHintBlock hint={install.pathHint} />
          </div>
        )}
      </div>
    );
  }
  if (install.phase === "removed") {
    return (
      <p className="rounded-lg border border-border bg-surface-2/40 px-4 py-3 text-xs text-fg-muted">
        Removed <code className="font-mono">{install.removedPath}</code>.
      </p>
    );
  }
  if (install.phase === "error") {
    return (
      <p className="rounded-lg border border-[oklch(60%_0.18_25)]/30 bg-[oklch(60%_0.18_25)]/10 px-4 py-3 text-xs text-[oklch(82%_0.16_25)]">
        {install.message}
      </p>
    );
  }
  return null;
}

function PathHintBlock({ hint }: { hint: string }) {
  return (
    <div className="flex items-start gap-2 rounded-md bg-surface-2 px-3 py-2 font-mono text-[11px] text-fg">
      <pre className="min-w-0 flex-1 whitespace-pre-wrap break-all">{hint}</pre>
      <button
        type="button"
        onClick={() => void navigator.clipboard?.writeText(hint)}
        aria-label="Copy"
        className="shrink-0 text-fg-muted transition-colors hover:text-fg"
      >
        <Copy className="size-3.5" />
      </button>
    </div>
  );
}

function samePath(a: string, b: string): boolean {
  return a.replace(/\/+$/g, "") === b.replace(/\/+$/g, "");
}
