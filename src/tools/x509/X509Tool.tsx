import { CodeEditor } from "../../components/ui/CodeEditor";
import { ResultList } from "../../components/ui/ResultList";
import { useLiveAction } from "../../lib/useLiveAction";
import { useSeed } from "../../lib/seed";
import { useToolState } from "../../lib/toolState";
import { runX509 } from "./run";

export function X509Tool() {
  const seed = useSeed();
  const [input, setInput] = useToolState("input", seed.value);
  const { data, error } = useLiveAction(() => runX509(input), [input]);

  const rows = data
    ? [
        { label: "Subject", value: data.subject },
        { label: "Issuer", value: data.issuer },
        { label: "Serial", value: data.serial },
        { label: "Not before", value: data.not_before },
        { label: "Not after", value: data.not_after },
        { label: "Algorithm", value: data.signature_algorithm },
        { label: "Version", value: data.version },
      ]
    : null;

  return (
    <div className="grid h-full grid-cols-2 divide-x divide-border">
      <div className="min-h-0 overflow-hidden">
        <CodeEditor
          value={input}
          onChange={setInput}
          ariaLabel="Certificate (PEM)"
          placeholder="-----BEGIN CERTIFICATE-----"
        />
      </div>
      <div className="min-h-0 overflow-auto p-4">
        {error ? (
          <div className="rounded-lg border border-border-strong bg-surface px-4 py-3 text-sm">
            <span className="font-medium text-accent">Invalid certificate</span>
            <span className="ml-2 text-fg-muted">{error}</span>
          </div>
        ) : rows ? (
          <div className="overflow-hidden rounded-xl border border-border bg-surface">
            <ResultList rows={rows} />
          </div>
        ) : (
          <p className="text-sm text-fg-subtle">
            Paste a PEM certificate to decode it.
          </p>
        )}
      </div>
    </div>
  );
}
