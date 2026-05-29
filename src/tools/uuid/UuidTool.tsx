import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { Segmented } from "../../components/ui/Segmented";
import { TextField } from "../../components/ui/TextField";
import { Toggle } from "../../components/ui/Toggle";
import { CopyButton } from "../../components/ui/CopyButton";
import { ResultList } from "../../components/ui/ResultList";
import { useLiveAction } from "../../lib/useLiveAction";
import { useSeed } from "../../lib/seed";
import { errorMessage } from "../../lib/ipc";
import { idGenerate, type Inspection } from "./api";
import { ID_KINDS, runInspect } from "./run";

function inspectionRows(info: Inspection) {
  return [
    { label: "Kind", value: info.kind },
    { label: "Version", value: info.version },
    { label: "Variant", value: info.variant },
    { label: "Canonical", value: info.canonical },
    { label: "Raw bytes", value: info.raw },
    { label: "Detail", value: info.detail },
  ].filter((row) => row.value !== "");
}

export function UuidTool() {
  const seed = useSeed();
  const [kind, setKind] = useState("uuid_v4");
  const [count, setCount] = useState(5);
  const [lowercased, setLowercased] = useState(false);
  const [ids, setIds] = useState<string[]>([]);
  const [genError, setGenError] = useState<string | null>(null);

  async function generate() {
    try {
      setIds(await idGenerate(kind, count, lowercased));
      setGenError(null);
    } catch (e) {
      setGenError(errorMessage(e));
    }
  }

  useEffect(() => {
    void generate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [inspectInput, setInspectInput] = useState(seed.value);
  const { data: inspection, error: inspectError } = useLiveAction(
    () => runInspect(inspectInput),
    [inspectInput],
  );

  return (
    <div className="flex h-full flex-col gap-8 overflow-auto p-4">
      <section className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <Segmented
            ariaLabel="ID type"
            options={ID_KINDS}
            value={kind}
            onChange={setKind}
          />
          <label className="flex items-center gap-2 text-xs text-fg-muted">
            Count
            <input
              type="number"
              min={1}
              max={100}
              value={count}
              aria-label="Count"
              onChange={(e) =>
                setCount(
                  Math.max(1, Math.min(100, Number(e.currentTarget.value) || 1)),
                )
              }
              className="h-9 w-20 rounded-lg border border-border bg-surface px-2 text-sm text-fg outline-none focus:border-border-strong"
            />
          </label>
          <Toggle
            active={lowercased}
            onClick={() => setLowercased((v) => !v)}
          >
            lowercased
          </Toggle>
          <button
            type="button"
            onClick={() => void generate()}
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-3 py-2 text-xs font-medium text-accent-fg transition-colors hover:bg-accent-hover"
          >
            <RefreshCw className="size-3.5" />
            Generate
          </button>
        </div>
        {genError ? (
          <p className="text-sm text-accent">{genError}</p>
        ) : (
          <div className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface">
            {ids.map((id, index) => (
              <div
                key={`${id}-${index}`}
                className="flex items-center gap-4 px-4 py-2.5"
              >
                <span className="min-w-0 flex-1 break-all font-mono text-sm text-fg">
                  {id}
                </span>
                <CopyButton value={id} label="" />
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-xs font-medium uppercase tracking-wider text-fg-subtle">
          Inspect
        </h2>
        <TextField
          ariaLabel="ID to inspect"
          value={inspectInput}
          onChange={setInspectInput}
          placeholder="Paste a UUID or ULID…"
          mono
        />
        {inspectError ? (
          <p className="text-sm text-accent">{inspectError}</p>
        ) : inspection ? (
          <div className="overflow-hidden rounded-xl border border-border bg-surface">
            <ResultList rows={inspectionRows(inspection)} />
          </div>
        ) : null}
      </section>
    </div>
  );
}
