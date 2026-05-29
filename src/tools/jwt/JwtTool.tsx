import { useState } from "react";
import { CodeEditor } from "../../components/ui/CodeEditor";
import { CopyButton } from "../../components/ui/CopyButton";
import { useLiveAction } from "../../lib/useLiveAction";
import { runJwt } from "./run";

function Section({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
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
  const [token, setToken] = useState("");
  const { data, error } = useLiveAction(() => runJwt(token), [token]);

  return (
    <div className="grid h-full grid-cols-2 divide-x divide-border">
      <div className="flex min-h-0 flex-col">
        <div className="border-b border-border px-4 py-2 text-xs font-medium uppercase tracking-wider text-fg-subtle">
          Encoded
        </div>
        <div className="min-h-0 flex-1 overflow-hidden">
          <CodeEditor
            value={token}
            onChange={setToken}
            ariaLabel="JWT token"
            placeholder="Paste a JWT…"
          />
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
