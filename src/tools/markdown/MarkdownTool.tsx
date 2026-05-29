import { CodeEditor } from "../../components/ui/CodeEditor";
import { useLiveAction } from "../../lib/useLiveAction";
import { useSeed } from "../../lib/seed";
import { useToolState } from "../../lib/toolState";
import { runMarkdown } from "./run";

export function MarkdownTool() {
  const seed = useSeed();
  const [input, setInput] = useToolState("input", seed.value);
  const { data } = useLiveAction(() => runMarkdown(input), [input]);

  return (
    <div className="grid h-full grid-cols-2 divide-x divide-border">
      <div className="min-h-0 overflow-hidden">
        <CodeEditor
          value={input}
          onChange={setInput}
          language="markdown"
          ariaLabel="Markdown input"
          placeholder="# Hello&#10;&#10;Some **markdown**."
        />
      </div>
      <iframe
        title="Markdown preview"
        sandbox=""
        srcDoc={data ?? ""}
        className="h-full w-full bg-white"
      />
    </div>
  );
}
