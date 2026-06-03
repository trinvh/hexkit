import { useEffect, useRef, useState } from "react";
import { Check, Copy, RefreshCw, Server, X } from "lucide-react";
import { useApp } from "../../store/app";
import { useTauriEvent } from "../../lib/useTauriEvent";
import { isTauri } from "../../lib/cli";
import { errorMessage } from "../../lib/ipc";
import { mcpStart, mcpStatus, mcpStop, type McpStatus } from "../../lib/mcp";

/**
 * Hosts the Settings modal (View → Settings…) and owns the MCP server's
 * lifecycle. Always mounted: on launch it re-starts the server if the user had
 * it enabled, and it opens the modal when the menu fires `view:open-settings`.
 */
export function SettingsManager() {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<McpStatus>({
    running: false,
    port: null,
    url: null,
  });
  const [error, setError] = useState<string | null>(null);

  const mcpEnabled = useApp((s) => s.mcpEnabled);
  const mcpPort = useApp((s) => s.mcpPort);
  const setMcpEnabled = useApp((s) => s.setMcpEnabled);
  const setMcpPort = useApp((s) => s.setMcpPort);
  const autoUpdateCheck = useApp((s) => s.autoUpdateCheck);
  const setAutoUpdateCheck = useApp((s) => s.setAutoUpdateCheck);

  useTauriEvent("view:open-settings", () => setOpen(true));

  // On launch, reconcile the OS-level server with the persisted preference:
  // start it if the user left it enabled, otherwise just read current status.
  const started = useRef(false);
  useEffect(() => {
    if (!isTauri() || started.current) return;
    started.current = true;
    void (async () => {
      try {
        setStatus(mcpEnabled ? await mcpStart(mcpPort) : await mcpStatus());
      } catch (e) {
        setError(errorMessage(e));
      }
    })();
    // Intentionally run once with the restored values.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function enable() {
    try {
      setStatus(await mcpStart(mcpPort));
      setMcpEnabled(true);
      setError(null);
    } catch (e) {
      setError(errorMessage(e));
      setMcpEnabled(false);
    }
  }

  async function disable() {
    setStatus(await mcpStop());
    setMcpEnabled(false);
    setError(null);
  }

  async function applyPort(port: number) {
    setMcpPort(port);
    if (!mcpEnabled) return;
    try {
      setStatus(await mcpStart(port));
      setError(null);
    } catch (e) {
      setError(errorMessage(e));
    }
  }

  if (!open) return null;
  return (
    <SettingsDialog
      onClose={() => setOpen(false)}
      enabled={mcpEnabled}
      port={mcpPort}
      status={status}
      error={error}
      onToggle={(next) => (next ? void enable() : void disable())}
      onPort={(p) => void applyPort(p)}
      autoUpdateCheck={autoUpdateCheck}
      onToggleAutoUpdate={setAutoUpdateCheck}
    />
  );
}

interface DialogProps {
  onClose: () => void;
  enabled: boolean;
  port: number;
  status: McpStatus;
  error: string | null;
  onToggle: (next: boolean) => void;
  onPort: (port: number) => void;
  autoUpdateCheck: boolean;
  onToggleAutoUpdate: (next: boolean) => void;
}

function SettingsDialog({
  onClose,
  enabled,
  port,
  status,
  error,
  onToggle,
  onPort,
  autoUpdateCheck,
  onToggleAutoUpdate,
}: DialogProps) {
  const url = status.url ?? `http://127.0.0.1:${port}/mcp`;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Settings"
      className="fixed inset-0 z-50 flex items-center justify-center bg-canvas/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-[min(520px,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl shadow-black/40"
      >
        <header className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="font-display text-base font-semibold tracking-tight">
            Settings
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

        <div className="space-y-5 px-5 py-5">
          <section>
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h3 className="flex items-center gap-2 font-display text-sm font-semibold tracking-tight">
                  <Server className="size-4 text-accent" />
                  MCP server
                </h3>
                <p className="mt-1 text-sm text-fg-muted">
                  Let AI agents (Claude Desktop, Cursor, …) call Hexkit&apos;s
                  deterministic tools — PGP, hashing, JWT, X.509, EMV-TLV, cron
                  and ID generation. Runs locally on loopback only; off by
                  default.
                </p>
              </div>
              <Switch checked={enabled} onChange={onToggle} label="Enable MCP server" />
            </div>

            <div className="mt-4 grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-3">
              <label htmlFor="mcp-port" className="text-sm text-fg-muted">
                Port
              </label>
              <input
                id="mcp-port"
                type="number"
                min={1024}
                max={65535}
                defaultValue={port}
                onBlur={(e) => {
                  const p = Number(e.target.value);
                  if (Number.isInteger(p) && p >= 1024 && p <= 65535 && p !== port) {
                    onPort(p);
                  }
                }}
                className="w-32 rounded-lg border border-border bg-canvas px-3 py-1.5 font-mono text-sm text-fg focus:border-border-strong focus:outline-none"
              />

              <span className="text-sm text-fg-muted">Status</span>
              <span className="text-sm">
                {status.running ? (
                  <span className="inline-flex items-center gap-1.5 text-[oklch(78%_0.15_150)]">
                    <span className="size-2 rounded-full bg-[oklch(78%_0.15_150)]" />
                    Running
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-fg-subtle">
                    <span className="size-2 rounded-full bg-fg-subtle" />
                    Stopped
                  </span>
                )}
              </span>
            </div>

            {error && (
              <p className="mt-3 rounded-lg border border-[oklch(65%_0.18_25)]/40 bg-[oklch(65%_0.18_25)]/10 px-3 py-2 text-sm text-[oklch(75%_0.16_25)]">
                {error}
              </p>
            )}

            <ClientConfig url={url} running={status.running} />
          </section>

          <section className="border-t border-border pt-5">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h3 className="flex items-center gap-2 font-display text-sm font-semibold tracking-tight">
                  <RefreshCw className="size-4 text-accent" />
                  Software updates
                </h3>
                <p className="mt-1 text-sm text-fg-muted">
                  Check GitHub for a newer Hexkit release on launch and flag it
                  in the sidebar. Turn this off to stay fully offline at
                  startup — you can still check anytime from the menu&apos;s
                  &ldquo;Check for Updates…&rdquo;.
                </p>
              </div>
              <Switch
                checked={autoUpdateCheck}
                onChange={onToggleAutoUpdate}
                label="Automatically check for updates"
              />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function Switch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
        checked ? "bg-accent" : "bg-surface-2"
      }`}
    >
      <span
        className={`inline-block size-5 transform rounded-full bg-white transition-transform ${
          checked ? "translate-x-5" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

type ConfigTab = "http" | "stdio";

/**
 * Per-client connection config, split by transport. The HTTP tab matches the
 * server this app hosts; the stdio tab is for clients that launch the binary
 * (e.g. Claude Desktop, whose connector UI rejects a local http URL).
 */
function ClientConfig({ url, running }: { url: string; running: boolean }) {
  const [tab, setTab] = useState<ConfigTab>("http");

  const httpSnippet = JSON.stringify(
    { mcpServers: { hexkit: { type: "http", url } } },
    null,
    2,
  );
  const stdioSnippet = JSON.stringify(
    { mcpServers: { hexkit: { command: "hexkit-mcp" } } },
    null,
    2,
  );

  return (
    <div className="mt-4">
      <div className="flex gap-1 border-b border-border">
        <TabButton active={tab === "http"} onClick={() => setTab("http")}>
          HTTP (URL)
        </TabButton>
        <TabButton active={tab === "stdio"} onClick={() => setTab("stdio")}>
          stdio (binary)
        </TabButton>
      </div>

      {tab === "http" ? (
        <div className="mt-3 space-y-2">
          <p className="text-xs text-fg-muted">
            Clients that take a local MCP URL — Claude Code, Cursor, Cline.
            {!running && " Enable the server above first."}
          </p>
          <ConfigBlock snippet={httpSnippet} />
        </div>
      ) : (
        <div className="mt-3 space-y-2">
          <p className="text-xs text-fg-muted">
            Clients that launch a binary over stdio — e.g. Claude Desktop, which
            can&apos;t use the http URL. Install once:
          </p>
          <ConfigBlock snippet="cargo install --path crates/hexkit-mcp" />
          <p className="text-xs text-fg-muted">
            then add this to the client config. If it can&apos;t find{" "}
            <code className="font-mono">hexkit-mcp</code> (GUI apps often
            don&apos;t see your shell PATH), use the absolute path, e.g.{" "}
            <code className="font-mono">~/.cargo/bin/hexkit-mcp</code>.
          </p>
          <ConfigBlock snippet={stdioSnippet} />
        </div>
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`-mb-px border-b-2 px-3 py-1.5 text-xs font-medium transition-colors ${
        active
          ? "border-accent text-fg"
          : "border-transparent text-fg-muted hover:text-fg"
      }`}
    >
      {children}
    </button>
  );
}

function ConfigBlock({ snippet }: { snippet: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="relative">
      <pre className="overflow-x-auto rounded-lg border border-border bg-canvas px-3 py-2.5 pr-16 font-mono text-xs text-fg">
        <code>{snippet}</code>
      </pre>
      <button
        type="button"
        onClick={() => {
          void navigator.clipboard?.writeText(snippet);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1500);
        }}
        className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-md border border-border bg-surface px-2 py-1 text-[11px] text-fg-muted transition-colors hover:border-border-strong hover:text-fg"
      >
        {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}
