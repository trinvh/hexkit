import { CodeEditor } from "../../components/ui/CodeEditor";
import { CopyButton } from "../../components/ui/CopyButton";
import { TextField } from "../../components/ui/TextField";
import { Segmented } from "../../components/ui/Segmented";
import { useLiveAction } from "../../lib/useLiveAction";
import { useSeed } from "../../lib/seed";
import { useToolState } from "../../lib/toolState";
import { JWT_ALGORITHMS, runSign } from "./run";
import type { JwtAlgorithm } from "./api";

export function JwtSignerTool() {
  const seed = useSeed();
  const [payload, setPayload] = useToolState("input", seed.value);
  const [secret, setSecret] = useToolState("secret", "");
  const [algorithm, setAlgorithm] = useToolState<JwtAlgorithm>(
    "algorithm",
    "HS256",
  );
  const { data, error } = useLiveAction(
    () => runSign(payload, secret, algorithm),
    [payload, secret, algorithm],
  );

  return (
    <div className="grid h-full grid-cols-2 divide-x divide-border">
      <div className="flex min-h-0 flex-col">
        <div className="flex items-center justify-between border-b border-border px-4 py-2">
          <span className="text-xs font-medium uppercase tracking-wider text-fg-subtle">
            Payload
          </span>
          <Segmented
            ariaLabel="Signing algorithm"
            options={JWT_ALGORITHMS}
            value={algorithm}
            onChange={setAlgorithm}
          />
        </div>
        <div className="min-h-0 flex-1 overflow-hidden">
          <CodeEditor
            value={payload}
            onChange={setPayload}
            language="json"
            ariaLabel="JWT payload"
            placeholder='{ "sub": "1234567890", "name": "John Doe" }'
          />
        </div>
        <div className="border-t border-border p-3">
          <TextField
            value={secret}
            onChange={setSecret}
            ariaLabel="HMAC secret"
            placeholder="HMAC secret to sign with…"
            mono
          />
        </div>
      </div>
      <div className="flex min-h-0 flex-col">
        <div className="flex items-center justify-between border-b border-border px-4 py-2">
          <span className="text-xs font-medium uppercase tracking-wider text-fg-subtle">
            Token
          </span>
          <CopyButton value={data ?? ""} label="" />
        </div>
        <div className="min-h-0 flex-1 overflow-auto">
          {error ? (
            <div className="m-4 rounded-lg border border-border-strong bg-surface px-3 py-2 text-xs">
              <span className="font-medium text-accent">Cannot sign</span>
              <span className="ml-2 text-fg-muted">{error}</span>
            </div>
          ) : data ? (
            <pre className="overflow-x-auto whitespace-pre-wrap break-all px-4 py-3 font-mono text-xs text-fg">
              {data}
            </pre>
          ) : (
            <p className="p-4 text-sm text-fg-subtle">
              Enter a JSON payload and a secret to sign a token.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
