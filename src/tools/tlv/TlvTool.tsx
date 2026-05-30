import { useState } from "react";
import { ChevronRight, ChevronDown } from "lucide-react";
import { CodeEditor } from "../../components/ui/CodeEditor";
import { CopyButton } from "../../components/ui/CopyButton";
import { InputActions } from "../../components/ui/InputActions";
import { useLiveAction } from "../../lib/useLiveAction";
import { useToolState } from "../../lib/toolState";
import { cn } from "../../lib/cn";
import type { TlvNode } from "./api";
import { runTlv } from "./run";

// EMV PSE select response: FCI template (6F) wrapping an Application Template
// (61) for the Mastercard credit AID, with label, priority and language
// preference. Lengths are checked at parse time, so this is a deliberately
// well-formed example.
const SAMPLE =
  "6F34840E315041592E5359532E4444463031A522BF0C1F611D4F07A0000000031010500A4D6173746572636172648701015F2D02656E";

export function TlvTool() {
  const [input, setInput] = useToolState("input", "");
  const { data, error } = useLiveAction(() => runTlv(input), [input]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-2.5">
        <span className="text-xs uppercase tracking-wider text-fg-subtle">
          BER-TLV decoder
        </span>
        <InputActions onInput={setInput} sample={SAMPLE} hasInput={input !== ""} />
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-1 divide-y divide-border lg:grid-cols-2 lg:divide-x lg:divide-y-0">
        <div className="min-h-0 overflow-hidden">
          <CodeEditor
            value={input}
            onChange={setInput}
            ariaLabel="TLV hex input"
            placeholder="Paste BER-TLV hex (whitespace, 0x prefixes and colons OK)"
          />
        </div>
        <div className="min-h-0 overflow-y-auto bg-canvas">
          {error ? (
            <p className="m-3 rounded-md border border-[oklch(60%_0.18_25)]/30 bg-[oklch(60%_0.18_25)]/10 px-3 py-2 text-sm text-[oklch(82%_0.16_25)]">
              {error}
            </p>
          ) : data && data.length > 0 ? (
            <div className="space-y-1.5 p-3 text-sm">
              {data.map((node, i) => (
                <TreeRow key={i} node={node} depth={0} />
              ))}
            </div>
          ) : (
            <p className="m-3 text-sm text-fg-subtle">
              Decoded TLV tree appears here.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function TreeRow({ node, depth }: { node: TlvNode; depth: number }) {
  const [open, setOpen] = useState(true);
  const hasKids = node.children.length > 0;
  const Chevron = open ? ChevronDown : ChevronRight;
  return (
    <div>
      <div
        className="flex items-start gap-2"
        style={{ paddingLeft: `${depth * 14}px` }}
      >
        {hasKids ? (
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Collapse" : "Expand"}
            className="mt-0.5 shrink-0 text-fg-subtle hover:text-fg"
          >
            <Chevron className="size-3.5" />
          </button>
        ) : (
          <span className="mt-0.5 size-3.5 shrink-0" />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-2">
            <span className="font-mono text-accent">{node.tag}</span>
            {node.name && (
              <span className="text-xs text-fg-muted">{node.name}</span>
            )}
            <span
              className={cn(
                "rounded px-1.5 py-0.5 text-[10px] uppercase tracking-wider",
                node.constructed
                  ? "bg-accent/12 text-accent"
                  : "bg-surface-2 text-fg-subtle",
              )}
            >
              {node.constructed ? "constructed" : "primitive"}
            </span>
            <span className="text-xs text-fg-subtle">len {node.length}</span>
          </div>
          {!node.constructed && (
            <div className="mt-1 flex items-start gap-2">
              <code className="min-w-0 flex-1 break-all rounded bg-surface-2/40 px-2 py-1 font-mono text-xs text-fg-muted">
                {node.value || "(empty)"}
              </code>
              {node.value && <CopyButton value={node.value} />}
            </div>
          )}
          {node.ascii && (
            <div className="mt-1 font-mono text-xs text-fg">
              ASCII: <span className="text-fg-muted">{node.ascii}</span>
            </div>
          )}
        </div>
      </div>
      {hasKids && open && (
        <div className="mt-1.5 space-y-1.5">
          {node.children.map((child, i) => (
            <TreeRow key={i} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}
