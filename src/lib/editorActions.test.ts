import { describe, it, expect, vi, beforeEach } from "vitest";

const readClipboardText = vi.fn();
vi.mock("./clipboard", () => ({
  readClipboardText: () => readClipboardText(),
}));

import {
  selectAllInEditor,
  copyFromEditor,
  cutFromEditor,
  pasteIntoEditor,
  clearEditor,
  type EditorLike,
} from "./editorActions";

const writeText = vi.fn(() => Promise.resolve());
Object.defineProperty(navigator, "clipboard", {
  value: { writeText },
  configurable: true,
});

/** Build a fake EditorView with the given doc text and selection range. */
function fakeView(doc: string, from = 0, to = 0): EditorLike & {
  dispatched: unknown[];
  focused: number;
} {
  return {
    dispatched: [],
    focused: 0,
    state: {
      doc: { length: doc.length, toString: () => doc },
      selection: { main: { from, to, empty: from === to } },
      sliceDoc: (a: number, b: number) => doc.slice(a, b),
    },
    dispatch(spec: unknown) {
      this.dispatched.push(spec);
    },
    focus() {
      this.focused += 1;
    },
  };
}

beforeEach(() => {
  writeText.mockClear();
  readClipboardText.mockReset();
});

describe("editorActions", () => {
  it("selectAll selects the whole document", () => {
    const view = fakeView("hello");
    selectAllInEditor(view);
    expect(view.dispatched[0]).toEqual({ selection: { anchor: 0, head: 5 } });
    expect(view.focused).toBe(1);
  });

  it("copy uses the selection when present", async () => {
    await copyFromEditor(fakeView("hello world", 6, 11));
    expect(writeText).toHaveBeenCalledWith("world");
  });

  it("copy falls back to the whole document when nothing is selected", async () => {
    await copyFromEditor(fakeView("hello"));
    expect(writeText).toHaveBeenCalledWith("hello");
  });

  it("cut copies then deletes the selection", async () => {
    const view = fakeView("hello world", 0, 5);
    await cutFromEditor(view);
    expect(writeText).toHaveBeenCalledWith("hello");
    expect(view.dispatched[0]).toEqual({
      changes: { from: 0, to: 5, insert: "" },
      selection: { anchor: 0 },
    });
  });

  it("cut does nothing without a selection", async () => {
    const view = fakeView("hello");
    await cutFromEditor(view);
    expect(writeText).not.toHaveBeenCalled();
    expect(view.dispatched).toHaveLength(0);
  });

  it("paste inserts clipboard text at the selection", async () => {
    readClipboardText.mockResolvedValue("X");
    const view = fakeView("ab", 1, 1);
    await pasteIntoEditor(view);
    expect(view.dispatched[0]).toEqual({
      changes: { from: 1, to: 1, insert: "X" },
      selection: { anchor: 2 },
    });
  });

  it("paste is a no-op when the clipboard is empty", async () => {
    readClipboardText.mockResolvedValue(null);
    const view = fakeView("ab", 1, 1);
    await pasteIntoEditor(view);
    expect(view.dispatched).toHaveLength(0);
  });

  it("clear empties the document", () => {
    const view = fakeView("hello");
    clearEditor(view);
    expect(view.dispatched[0]).toEqual({
      changes: { from: 0, to: 5, insert: "" },
    });
  });
});
