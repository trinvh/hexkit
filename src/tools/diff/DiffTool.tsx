import { Segmented } from "../../components/ui/Segmented";
import { Toggle } from "../../components/ui/Toggle";
import { CodeEditor } from "../../components/ui/CodeEditor";
import { useLiveAction } from "../../lib/useLiveAction";
import { useToolState } from "../../lib/toolState";
import { cn } from "../../lib/cn";
import { runDiff, DIFF_FORMATS } from "./run";
import type { DiffFormat } from "./api";

export function DiffTool() {
  const [oldText, setOldText] = useToolState("old", "");
  const [newText, setNewText] = useToolState("new", "");
  const [format, setFormat] = useToolState<DiffFormat>("format", "text");
  const [sort, setSort] = useToolState("sort", false);
  const { data, error } = useLiveAction(
    () => runDiff(oldText, newText, format, sort),
    [oldText, newText, format, sort],
  );

  const language =
    format === "json" ? "json" : format === "xml" ? "xml" : undefined;

  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 items-center gap-2 border-b border-border px-4 py-2.5">
        <Segmented
          ariaLabel="Diff format"
          options={DIFF_FORMATS}
          value={format}
          onChange={setFormat}
        />
        {format === "json" && (
          <Toggle active={sort} onClick={() => setSort((s) => !s)}>
            Sort keys
          </Toggle>
        )}
        <span className="ml-1 text-xs text-fg-subtle">
          {format === "text"
            ? "Compares line by line"
            : `Formats each side as ${format.toUpperCase()} before diffing`}
        </span>
      </div>

      <div className="grid h-1/2 grid-cols-2 divide-x divide-border border-b border-border">
        <div className="min-h-0 overflow-hidden">
          <CodeEditor
            value={oldText}
            onChange={setOldText}
            language={language}
            ariaLabel="Original text"
            placeholder="Original…"
          />
        </div>
        <div className="min-h-0 overflow-hidden">
          <CodeEditor
            value={newText}
            onChange={setNewText}
            language={language}
            ariaLabel="Changed text"
            placeholder="Changed…"
          />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto py-2">
        {error ? (
          <div className="mx-4 rounded-lg border border-border-strong bg-surface px-3 py-2 text-xs">
            <span className="font-medium text-accent">Cannot format input</span>
            <span className="ml-2 text-fg-muted">{error}</span>
          </div>
        ) : data && data.length > 0 ? (
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
