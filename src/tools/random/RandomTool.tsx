import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { Toggle } from "../../components/ui/Toggle";
import { CopyButton } from "../../components/ui/CopyButton";
import { errorMessage } from "../../lib/ipc";
import { randomGenerate } from "./api";

export function RandomTool() {
  const [length, setLength] = useState(24);
  const [uppercase, setUppercase] = useState(true);
  const [lowercase, setLowercase] = useState(true);
  const [digits, setDigits] = useState(true);
  const [symbols, setSymbols] = useState(false);
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    try {
      setValue(
        await randomGenerate({ length, uppercase, lowercase, digits, symbols }),
      );
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
    <div className="flex h-full flex-col gap-4 p-4">
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-xs text-fg-muted">
          Length
          <input
            type="number"
            min={1}
            max={1024}
            value={length}
            aria-label="Length"
            onChange={(e) =>
              setLength(
                Math.max(1, Math.min(1024, Number(e.currentTarget.value) || 1)),
              )
            }
            className="h-9 w-20 rounded-lg border border-border bg-surface px-2 text-sm text-fg outline-none focus:border-border-strong"
          />
        </label>
        <Toggle active={uppercase} onClick={() => setUppercase((v) => !v)}>
          A-Z
        </Toggle>
        <Toggle active={lowercase} onClick={() => setLowercase((v) => !v)}>
          a-z
        </Toggle>
        <Toggle active={digits} onClick={() => setDigits((v) => !v)}>
          0-9
        </Toggle>
        <Toggle active={symbols} onClick={() => setSymbols((v) => !v)}>
          Symbols
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

      {error ? (
        <p className="text-sm text-accent">{error}</p>
      ) : (
        <div className="flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3">
          <span className="min-w-0 flex-1 break-all font-mono text-sm text-fg">
            {value}
          </span>
          <CopyButton value={value} label="" />
        </div>
      )}
    </div>
  );
}
