import { readClipboardText } from "./clipboard";

/**
 * The slice of a CodeMirror `EditorView` the context-menu actions touch.
 * Narrowed to an interface so the actions are unit-testable with a fake view.
 */
export interface EditorLike {
  state: {
    doc: { length: number; toString(): string };
    selection: { main: { from: number; to: number; empty: boolean } };
    sliceDoc(from: number, to: number): string;
  };
  dispatch(spec: unknown): void;
  focus(): void;
}

/** Select the whole document. */
export function selectAllInEditor(view: EditorLike): void {
  view.dispatch({ selection: { anchor: 0, head: view.state.doc.length } });
  view.focus();
}

/** Copy the selection, or the whole document when nothing is selected. */
export async function copyFromEditor(view: EditorLike): Promise<void> {
  const { main } = view.state.selection;
  const text = main.empty
    ? view.state.doc.toString()
    : view.state.sliceDoc(main.from, main.to);
  if (text) await navigator.clipboard.writeText(text);
}

/** Copy the selection to the clipboard and remove it from the document. */
export async function cutFromEditor(view: EditorLike): Promise<void> {
  const { main } = view.state.selection;
  if (main.empty) return;
  const text = view.state.sliceDoc(main.from, main.to);
  await navigator.clipboard.writeText(text);
  view.dispatch({
    changes: { from: main.from, to: main.to, insert: "" },
    selection: { anchor: main.from },
  });
  view.focus();
}

/** Insert clipboard text at the selection (replacing it). */
export async function pasteIntoEditor(view: EditorLike): Promise<void> {
  const text = await readClipboardText();
  if (text == null || text === "") return;
  const { main } = view.state.selection;
  view.dispatch({
    changes: { from: main.from, to: main.to, insert: text },
    selection: { anchor: main.from + text.length },
  });
  view.focus();
}

/** Remove all text from the document. */
export function clearEditor(view: EditorLike): void {
  view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: "" } });
  view.focus();
}
