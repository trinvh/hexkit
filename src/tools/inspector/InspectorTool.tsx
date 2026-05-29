import { CodeEditor } from "../../components/ui/CodeEditor";
import { InputActions } from "../../components/ui/InputActions";
import { ResultList } from "../../components/ui/ResultList";
import { useLiveAction } from "../../lib/useLiveAction";
import { useSeed } from "../../lib/seed";
import { useToolState } from "../../lib/toolState";
import { inspectString } from "./api";

const SAMPLE = "Hello, 世界! 🌍\nThe quick brown fox jumps over the lazy dog.";

export function InspectorTool() {
  const seed = useSeed();
  const [input, setInput] = useToolState("input", seed.value);
  const { data } = useLiveAction(() => inspectString(input), [input]);

  const rows = [
    { label: "Characters", value: String(data?.characters ?? 0) },
    { label: "Bytes", value: String(data?.bytes ?? 0) },
    { label: "Words", value: String(data?.words ?? 0) },
    { label: "Lines", value: String(data?.lines ?? 0) },
  ];

  return (
    <div className="grid h-full grid-cols-2 divide-x divide-border">
      <div className="flex min-h-0 flex-col">
        <div className="flex items-center justify-end border-b border-border px-3 py-2">
          <InputActions
            onInput={setInput}
            sample={SAMPLE}
            hasInput={input !== ""}
          />
        </div>
        <div className="min-h-0 flex-1 overflow-hidden">
          <CodeEditor
            value={input}
            onChange={setInput}
            ariaLabel="Text to inspect"
            placeholder="Type or paste text…"
          />
        </div>
      </div>
      <div className="overflow-auto p-4">
        <div className="overflow-hidden rounded-xl border border-border bg-surface">
          <ResultList rows={rows} />
        </div>
      </div>
    </div>
  );
}
