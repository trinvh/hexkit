import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { Segmented } from "../../components/ui/Segmented";
import { CodeEditor } from "../../components/ui/CodeEditor";
import { CopyButton } from "../../components/ui/CopyButton";
import { errorMessage } from "../../lib/ipc";
import { loremGenerate } from "./api";
import { LOREM_KINDS, type LoremKind } from "./run";

export function LoremTool() {
  const [kind, setKind] = useState<LoremKind>("paragraphs");
  const [count, setCount] = useState(3);
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    try {
      setValue(await loremGenerate(kind, count));
      setError(null);
    } catch (e) {
      setError(errorMessage(e));
      setValue("");
    }
  }

  useEffect(() => {
    void generate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-2.5">
        <div className="flex items-center gap-3">
          <Segmented
            ariaLabel="Lorem kind"
            options={LOREM_KINDS}
            value={kind}
            onChange={setKind}
          />
          <label className="flex items-center gap-2 text-xs text-fg-muted">
            Count
            <input
              type="number"
              min={1}
              max={500}
              value={count}
              aria-label="Count"
              onChange={(e) =>
                setCount(
                  Math.max(1, Math.min(500, Number(e.currentTarget.value) || 1)),
                )
              }
              className="h-9 w-20 rounded-lg border border-border bg-surface px-2 text-sm text-fg outline-none focus:border-border-strong"
            />
          </label>
          <button
            type="button"
            onClick={() => void generate()}
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-3 py-2 text-xs font-medium text-accent-fg transition-colors hover:bg-accent-hover"
          >
            <RefreshCw className="size-3.5" />
            Generate
          </button>
        </div>
        <CopyButton value={value} label="Copy" />
      </div>
      <div className="min-h-0 flex-1 overflow-hidden">
        {error ? (
          <p className="p-4 text-sm text-accent">{error}</p>
        ) : (
          <CodeEditor value={value} readOnly ariaLabel="Lorem ipsum output" />
        )}
      </div>
    </div>
  );
}
