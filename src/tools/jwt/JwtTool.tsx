import { useState } from "react";
import { CodeEditor } from "../../components/ui/CodeEditor";
import { CopyButton } from "../../components/ui/CopyButton";
import { TextField } from "../../components/ui/TextField";
import { ResultList } from "../../components/ui/ResultList";
import { useLiveAction } from "../../lib/useLiveAction";
import { useSeed } from "../../lib/seed";
import { cn } from "../../lib/cn";
import { runJwt, runVerify } from "./run";
import { humanizeClaims, algorithmOf } from "./claims";

function Section({ title, body }: { title: string; body: string }) {
  return (
    <div className="border-b border-border">
      <div className="flex items-center justify-between px-4 py-2">
        <span className="text-xs font-medium uppercase tracking-wider text-fg-subtle">
          {title}
        </span>
        <CopyButton value={body} label="" />
      </div>
      <pre className="overflow-x-auto whitespace-pre-wrap break-all px-4 pb-3 font-mono text-xs text-fg">
        {body}
      </pre>
    </div>
  );
}

export function JwtTool() {
  const seed = useSeed();
  const [token, setToken] = useState(seed.value);
  const [secret, setSecret] = useState("");
  const { data, error } = useLiveAction(() => runJwt(token), [token]);
  const { data: verification } = useLiveAction(
    () => runVerify(token, secret),
    [token, secret],
  );

  const claims = data ? humanizeClaims(data.payload) : [];
  const algorithm = data ? algorithmOf(data.header) : null;

  return (
    <div className="grid h-full grid-cols-2 divide-x divide-border">
      <div className="flex min-h-0 flex-col">
        <div className="flex items-center justify-between border-b border-border px-4 py-2">
          <span className="text-xs font-medium uppercase tracking-wider text-fg-subtle">
            Encoded
          </span>
          {algorithm && (
            <span className="rounded-full border border-border px-2 py-0.5 font-mono text-[11px] text-fg-muted">
              {algorithm}
            </span>
          )}
        </div>
        <div className="min-h-0 flex-1 overflow-hidden">
          <CodeEditor
            value={token}
            onChange={setToken}
            ariaLabel="JWT token"
            placeholder="Paste a JWT…"
          />
        </div>
        <div className="border-t border-border p-3">
          <TextField
            value={secret}
            onChange={setSecret}
            ariaLabel="HMAC secret"
            placeholder="HMAC secret to verify the signature…"
            mono
          />
          {verification && (
            <div
              className={cn(
                "mt-2 rounded-lg px-3 py-2 text-xs font-medium",
                verification.valid
                  ? "bg-emerald-500/12 text-emerald-600 dark:text-emerald-400"
                  : "bg-red-500/12 text-red-600 dark:text-red-400",
              )}
            >
              {verification.valid
                ? `✓ Signature verified (${verification.algorithm})`
                : `✗ ${verification.reason ?? "Signature invalid"}`}
            </div>
          )}
        </div>
      </div>
      <div className="min-h-0 overflow-auto">
        {error ? (
          <div className="m-4 rounded-lg border border-border-strong bg-surface px-3 py-2 text-xs">
            <span className="font-medium text-accent">Invalid token</span>
            <span className="ml-2 text-fg-muted">{error}</span>
          </div>
        ) : data ? (
          <>
            <Section title="Header" body={data.header} />
            <Section title="Payload" body={data.payload} />
            {claims.length > 0 && (
              <div className="border-b border-border">
                <div className="px-4 py-2 text-xs font-medium uppercase tracking-wider text-fg-subtle">
                  Claims
                </div>
                <ResultList rows={claims} />
              </div>
            )}
            <Section title="Signature" body={data.signature} />
          </>
        ) : (
          <p className="p-4 text-sm text-fg-subtle">
            Paste a JWT to decode its header and payload.
          </p>
        )}
      </div>
    </div>
  );
}
