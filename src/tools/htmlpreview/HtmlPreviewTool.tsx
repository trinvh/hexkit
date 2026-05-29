import { CodeEditor } from "../../components/ui/CodeEditor";
import { useSeed } from "../../lib/seed";
import { useToolState } from "../../lib/toolState";

export function HtmlPreviewTool() {
  const seed = useSeed();
  const [input, setInput] = useToolState("input", seed.value);

  return (
    <div className="grid h-full grid-cols-2 divide-x divide-border">
      <div className="min-h-0 overflow-hidden">
        <CodeEditor
          value={input}
          onChange={setInput}
          language="html"
          ariaLabel="HTML source"
          placeholder="<h1>Hello</h1>"
        />
      </div>
      <iframe
        title="HTML preview"
        sandbox=""
        srcDoc={input}
        className="h-full w-full bg-white"
      />
    </div>
  );
}
