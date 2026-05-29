import { useEffect, useMemo, useState } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { EditorView } from "@codemirror/view";
import type { Extension } from "@codemirror/state";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { tags as t } from "@lezer/highlight";

const baseTheme = EditorView.theme({
  "&": { backgroundColor: "transparent", color: "var(--fg)", height: "100%" },
  ".cm-scroller": {
    fontFamily: "var(--font-mono)",
    fontSize: "13px",
    lineHeight: "1.6",
  },
  ".cm-content": { padding: "12px 0", caretColor: "var(--accent)" },
  ".cm-gutters": {
    backgroundColor: "transparent",
    color: "var(--fg-subtle)",
    border: "none",
  },
  ".cm-lineNumbers .cm-gutterElement": { padding: "0 12px 0 18px" },
  ".cm-activeLine": {
    backgroundColor: "color-mix(in oklch, var(--fg) 4%, transparent)",
  },
  ".cm-activeLineGutter": { backgroundColor: "transparent", color: "var(--fg-muted)" },
  "&.cm-focused": { outline: "none" },
  ".cm-cursor, .cm-dropCursor": { borderLeftColor: "var(--accent)" },
  ".cm-selectionBackground, &.cm-focused .cm-selectionBackground": {
    backgroundColor: "color-mix(in oklch, var(--accent) 22%, transparent)",
  },
  ".cm-placeholder": { color: "var(--fg-subtle)" },
});

const highlightStyle = HighlightStyle.define([
  { tag: t.comment, color: "var(--fg-subtle)", fontStyle: "italic" },
  { tag: [t.keyword, t.operator, t.modifier, t.controlKeyword], color: "var(--cm-keyword)" },
  { tag: [t.string, t.special(t.string), t.attributeValue], color: "var(--cm-string)" },
  { tag: [t.number, t.bool, t.null, t.literal], color: "var(--cm-number)" },
  { tag: [t.propertyName, t.attributeName, t.definition(t.variableName)], color: "var(--cm-key)" },
  { tag: [t.tagName, t.typeName, t.className, t.namespace], color: "var(--cm-tag)" },
  { tag: [t.function(t.variableName), t.labelName], color: "var(--cm-key)" },
  { tag: [t.punctuation, t.separator, t.bracket, t.angleBracket], color: "var(--fg-subtle)" },
]);

// Language grammars are imported on demand so each one is its own chunk and
// only the language a tool actually uses is fetched.
const LANGUAGE_LOADERS = {
  json: () => import("@codemirror/lang-json").then((m) => m.json()),
  css: () => import("@codemirror/lang-css").then((m) => m.css()),
  html: () => import("@codemirror/lang-html").then((m) => m.html()),
  xml: () => import("@codemirror/lang-xml").then((m) => m.xml()),
  sql: () => import("@codemirror/lang-sql").then((m) => m.sql()),
  yaml: () => import("@codemirror/lang-yaml").then((m) => m.yaml()),
  markdown: () => import("@codemirror/lang-markdown").then((m) => m.markdown()),
  javascript: () =>
    import("@codemirror/lang-javascript").then((m) =>
      m.javascript({ jsx: true, typescript: true }),
    ),
} as const satisfies Record<string, () => Promise<Extension>>;

export type CodeLanguage = keyof typeof LANGUAGE_LOADERS;

export interface CodeEditorProps {
  value: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  language?: CodeLanguage;
  placeholder?: string;
  ariaLabel?: string;
}

export function CodeEditor({
  value,
  onChange,
  readOnly = false,
  language,
  placeholder,
  ariaLabel,
}: CodeEditorProps) {
  const [langExtension, setLangExtension] = useState<Extension | null>(null);

  useEffect(() => {
    if (!language) {
      setLangExtension(null);
      return;
    }
    let active = true;
    void LANGUAGE_LOADERS[language]().then((ext) => {
      if (active) setLangExtension(ext);
    });
    return () => {
      active = false;
    };
  }, [language]);

  const extensions = useMemo<Extension[]>(() => {
    const ext: Extension[] = [
      syntaxHighlighting(highlightStyle),
      EditorView.lineWrapping,
    ];
    if (langExtension) ext.push(langExtension);
    return ext;
  }, [langExtension]);

  return (
    <CodeMirror
      value={value}
      onChange={onChange}
      readOnly={readOnly}
      editable={!readOnly}
      theme={baseTheme}
      extensions={extensions}
      placeholder={placeholder}
      height="100%"
      className="h-full"
      aria-label={ariaLabel}
      basicSetup={{
        lineNumbers: true,
        foldGutter: false,
        autocompletion: false,
        highlightActiveLine: !readOnly,
        closeBrackets: !readOnly,
      }}
    />
  );
}
