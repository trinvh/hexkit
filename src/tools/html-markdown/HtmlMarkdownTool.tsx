import { TransformLayout } from "../../components/ui/TransformLayout";
import { useLiveAction } from "../../lib/useLiveAction";
import { useSeed } from "../../lib/seed";
import { useToolState } from "../../lib/toolState";
import { runHtmlMarkdown } from "./run";

export function HtmlMarkdownTool() {
  const seed = useSeed();
  const [input, setInput] = useToolState("input", seed.value);
  const { data, error, loading } = useLiveAction(
    () => runHtmlMarkdown(input),
    [input],
  );

  return (
    <TransformLayout
      toolbar={<span className="text-sm text-fg-muted">HTML → Markdown</span>}
      input={input}
      onInput={setInput}
      output={data ?? ""}
      error={error}
      loading={loading}
      inputLanguage="html"
      outputLanguage="markdown"
      inputLabel="HTML input"
      outputLabel="Markdown output"
      inputPlaceholder="<h1>Title</h1><p>Some <strong>text</strong>.</p>"
      sample='<h1>Hexkit</h1><p>Offline developer tools, including a <a href="https://hexkit.app">website</a>.</p><ul><li>Fast</li><li>Private</li></ul>'
      outputPlaceholder="Result appears here"
      errorTitle="HTML error"
    />
  );
}
