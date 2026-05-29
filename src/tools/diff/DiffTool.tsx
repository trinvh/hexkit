import { useState } from "react";
import { CodeEditor } from "../../components/ui/CodeEditor";
import { useLiveAction } from "../../lib/useLiveAction";
import { cn } from "../../lib/cn";
import { runDiff } from "./run";

export function DiffTool() {
  const [oldText, setOldText] = useState("");
  const [newText, setNewText] = useState("");
  const { data } = useLiveAction(
    () => runDiff(oldText, newText),
    [oldText, newText],
  );

  return (
    <div className="flex h-full flex-col">
      <div className="grid h-1/2 grid-cols-2 divide-x divide-border border-b border-border">
        <div className="min-h-0 overflow-hidden">
          <CodeEditor
            value={oldText}
            onChange={setOldText}
            ariaLabel="Original text"
            placeholder="Original…"
          />
        </div>
        <div className="min-h-0 overflow-hidden">
          <CodeEditor
            value={newText}
            onChange={setNewText}
            ariaLabel="Changed text"
            placeholder="Changed…"
          />
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-auto py-2">
        {data && data.length > 0 ? (
          data.map((line, index) => {
            const prefix =
              line.tag === "insert" ? "+" : line.tag === "delete" ? "-" : " ";
            return (
              <div
                key={index}
                className={cn(
                  "whitespace-pre-wrap px-4 font-mono text-xs leading-5",
                  line.tag === "insert" &&
                    "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
                  line.tag === "delete" &&
                    "bg-red-500/10 text-red-600 dark:text-red-400",
                  line.tag === "equal" && "text-fg-muted",
                )}
              >
                <span className="mr-3 select-none text-fg-subtle">{prefix}</span>
                {line.value || " "}
              </div>
            );
          })
        ) : (
          <p className="px-4 text-sm text-fg-subtle">
            Enter text in both panes to see the diff.
          </p>
        )}
      </div>
    </div>
  );
}
