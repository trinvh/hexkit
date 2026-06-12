import { useEffect, useMemo, useRef, useState } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { EditorView } from "@codemirror/view";
import type { Extension } from "@codemirror/state";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { tags as t } from "@lezer/highlight";
import { ClipboardPaste, Copy, Eraser, Scissors, TextSelect } from "lucide-react";
import { isLargeText } from "../../lib/largeText";
import { Menu, type MenuItem } from "./Menu";
import {
  clearEditor,
  copyFromEditor,
  cutFromEditor,
  pasteIntoEditor,
  selectAllInEditor,
} from "../../lib/editorActions";

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
  const viewRef = useRef<EditorView | null>(null);
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);

  // For very large documents, skip syntax highlighting and line wrapping:
  // CodeMirror tokenizing and wrapping megabytes is synchronous and freezes the
  // UI. Plain text stays editable and responsive.
  const tooLargeToDecorate = isLargeText(value);

  useEffect(() => {
    if (!language || tooLargeToDecorate) {
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
  }, [language, tooLargeToDecorate]);

  const extensions = useMemo<Extension[]>(() => {
    if (tooLargeToDecorate) return [];
    const ext: Extension[] = [
      syntaxHighlighting(highlightStyle),
      EditorView.lineWrapping,
    ];
    if (langExtension) ext.push(langExtension);
    return ext;
  }, [langExtension, tooLargeToDecorate]);

  function openContextMenu(event: React.MouseEvent) {
    if (!viewRef.current) return;
    event.preventDefault();
    setMenu({ x: event.clientX, y: event.clientY });
  }

  const view = viewRef.current;
  const hasContent = (view?.state.doc.length ?? value.length) > 0;
  const hasSelection = view ? !view.state.selection.main.empty : false;

  const menuItems: MenuItem[] = [];
  if (!readOnly) {
    menuItems.push({
      label: "Cut",
      icon: Scissors,
      disabled: !hasSelection,
      onSelect: () => view && void cutFromEditor(view),
    });
  }
  menuItems.push({
    label: "Copy",
    icon: Copy,
    disabled: !hasContent,
    onSelect: () => view && void copyFromEditor(view),
  });
  if (!readOnly) {
    menuItems.push({
      label: "Paste",
      icon: ClipboardPaste,
      onSelect: () => view && void pasteIntoEditor(view),
    });
  }
  menuItems.push({
    label: "Select All",
    icon: TextSelect,
    disabled: !hasContent,
    onSelect: () => view && selectAllInEditor(view),
  });
  if (!readOnly) {
    menuItems.push({
      label: "Clear",
      icon: Eraser,
      danger: true,
      disabled: !hasContent,
      onSelect: () => view && clearEditor(view),
    });
  }

  return (
    <div className="h-full" onContextMenu={openContextMenu}>
      <CodeMirror
        value={value}
        onChange={onChange}
        onCreateEditor={(editorView) => {
          viewRef.current = editorView;
        }}
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
      {menu && (
        <Menu
          x={menu.x}
          y={menu.y}
          items={menuItems}
          onClose={() => setMenu(null)}
        />
      )}
    </div>
  );
}
