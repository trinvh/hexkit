import { type ReactNode } from "react";
import { TextField } from "../../components/ui/TextField";
import { CopyButton } from "../../components/ui/CopyButton";
import { readClipboardText } from "../../lib/clipboard";
import { useLiveAction } from "../../lib/useLiveAction";
import { useToolState } from "../../lib/toolState";
import { NUMBER_BASES, runAll } from "./run";
import type { AllBases } from "./api";

type FieldKey = "binary" | "octal" | "decimal" | "hexadecimal" | "custom";

interface Source {
  key: FieldKey;
  base: number;
  value: string;
}

const SAMPLE: Source = { key: "decimal", base: 10, value: "621985836" };

const smallBtn =
  "rounded-lg border border-border px-2.5 py-1 text-xs text-fg-muted transition-colors hover:border-border-strong hover:text-fg";

function BaseField({
  label,
  value,
  onChange,
  onPaste,
  onClear,
  extra,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onPaste: () => void;
  onClear: () => void;
  /** Extra controls shown between the label and the Clipboard button. */
  extra?: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-fg">{label}</span>
        {extra}
        <button type="button" className={smallBtn} onClick={onPaste}>
          Clipboard
        </button>
        <button type="button" className={smallBtn} onClick={onClear}>
          Clear
        </button>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <TextField
            ariaLabel={label}
            value={value}
            onChange={onChange}
            mono
          />
        </div>
        <CopyButton value={value} label="Copy" />
      </div>
    </div>
  );
}

export function NumberTool() {
  const [source, setSource] = useToolState<Source | null>("source", null);
  const [customBase, setCustomBase] = useToolState("customBase", "36");
  const { data } = useLiveAction(
    () =>
      source ? runAll(source.value, source.base, Number(customBase)) : null,
    [source, customBase],
  );

  // The field being edited shows the raw input; the rest show the computed value.
  const valueFor = (key: FieldKey, computed: keyof AllBases): string => {
    if (source?.key === key) return source.value;
    return data ? data[computed] : "";
  };

  const edit = (key: FieldKey, base: number) => (value: string) =>
    setSource({ key, base, value });

  const paste = (key: FieldKey, base: number) => async () => {
    const text = await readClipboardText();
    if (text != null) setSource({ key, base, value: text });
  };

  const clear = (key: FieldKey, base: number) => () =>
    setSource({ key, base, value: "" });

  return (
    <div className="flex h-full flex-col overflow-auto p-4">
      <p className="mb-4 text-sm text-fg-muted">
        Enter your number in any field — the others are calculated automatically.
      </p>
      <div className="space-y-4">
        <BaseField
          label="Base 2 (Binary)"
          value={valueFor("binary", "binary")}
          onChange={edit("binary", 2)}
          onPaste={paste("binary", 2)}
          onClear={clear("binary", 2)}
        />
        <BaseField
          label="Base 8 (Octal)"
          value={valueFor("octal", "octal")}
          onChange={edit("octal", 8)}
          onPaste={paste("octal", 8)}
          onClear={clear("octal", 8)}
        />
        <BaseField
          label="Base 10 (Decimal)"
          value={valueFor("decimal", "decimal")}
          onChange={edit("decimal", 10)}
          onPaste={paste("decimal", 10)}
          onClear={clear("decimal", 10)}
        />
        <BaseField
          label="Base 16 (Hex)"
          value={valueFor("hexadecimal", "hexadecimal")}
          onChange={edit("hexadecimal", 16)}
          onPaste={paste("hexadecimal", 16)}
          onClear={clear("hexadecimal", 16)}
        />
        <BaseField
          label="Select base:"
          value={valueFor("custom", "custom")}
          onChange={edit("custom", Number(customBase))}
          onPaste={paste("custom", Number(customBase))}
          onClear={clear("custom", Number(customBase))}
          extra={
            <>
              <select
                aria-label="Custom base"
                value={customBase}
                onChange={(e) => setCustomBase(e.target.value)}
                className="h-7 rounded-lg border border-border bg-surface px-1.5 text-xs text-fg outline-none focus:border-border-strong"
              >
                {NUMBER_BASES.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.value}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className={smallBtn}
                onClick={() => setSource(SAMPLE)}
              >
                Sample
              </button>
            </>
          }
        />
      </div>
    </div>
  );
}
