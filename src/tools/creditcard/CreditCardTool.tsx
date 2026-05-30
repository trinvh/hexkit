import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { CopyButton } from "../../components/ui/CopyButton";
import { Segmented } from "../../components/ui/Segmented";
import { errorMessage } from "../../lib/ipc";
import { useToolState } from "../../lib/toolState";
import { BRANDS, type Brand, type GeneratedCard } from "./api";
import { runGenerate } from "./run";

export function CreditCardTool() {
  const [brand, setBrand] = useToolState<Brand>("brand", "visa");
  const [count, setCount] = useToolState("count", 5);
  const [cards, setCards] = useState<GeneratedCard[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    try {
      const next = await runGenerate(brand, count);
      setCards(next);
      setError(null);
    } catch (e) {
      setError(errorMessage(e));
      setCards([]);
    }
  }

  useEffect(() => {
    void generate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex h-full flex-col gap-4 p-4">
      <div className="flex flex-wrap items-center gap-3">
        <Segmented
          ariaLabel="Card brand"
          options={BRANDS.map((b) => ({ value: b.value, label: b.label }))}
          value={brand}
          onChange={setBrand}
        />
        <label className="flex items-center gap-2 text-xs text-fg-muted">
          Count
          <input
            type="number"
            min={1}
            max={50}
            value={count}
            onChange={(e) =>
              setCount(Math.max(1, Math.min(50, Number(e.currentTarget.value) || 1)))
            }
            className="w-16 rounded-md border border-border bg-canvas px-2 py-1 text-sm text-fg outline-none focus:border-border-strong"
          />
        </label>
        <button
          type="button"
          onClick={() => void generate()}
          className="inline-flex items-center gap-2 rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-accent-fg transition-colors hover:bg-accent-hover"
        >
          <RefreshCw className="size-3.5" />
          Generate
        </button>
        {cards.length > 0 && (
          <CopyButton
            value={cards.map((c) => c.number).join("\n")}
            label="Copy all"
          />
        )}
      </div>
      <p className="rounded-md border border-border bg-surface-2/40 px-3 py-2 text-xs text-fg-muted">
        Test numbers only — they pass Luhn validation but are not real cards
        and must not be used to attempt a real payment.
      </p>
      {error && (
        <p className="rounded-md border border-[oklch(60%_0.18_25)]/30 bg-[oklch(60%_0.18_25)]/10 px-3 py-2 text-sm text-[oklch(82%_0.16_25)]">
          {error}
        </p>
      )}
      <div className="min-h-0 flex-1 overflow-y-auto rounded-lg border border-border">
        {cards.map((card) => (
          <div
            key={card.number}
            className="flex items-center justify-between gap-3 border-b border-border px-4 py-3 last:border-b-0"
          >
            <div className="min-w-0 flex-1">
              <div className="font-mono text-sm text-fg">{card.formatted}</div>
              <div className="mt-0.5 text-xs text-fg-subtle">{card.brand}</div>
            </div>
            <CopyButton value={card.number} />
          </div>
        ))}
      </div>
    </div>
  );
}
