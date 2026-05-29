import { ClipboardPaste, FileText, X } from "lucide-react";
import { readClipboardText } from "../../lib/clipboard";
import { cn } from "../../lib/cn";

interface InputActionsProps {
  /** Replace the current input value. */
  onInput: (value: string) => void;
  /** Sample value; when set, a "Sample" button loads it. */
  sample?: string;
  /** Whether there is input to clear (shows the Clear button). */
  hasInput?: boolean;
}

const buttonClass = cn(
  "inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1 text-xs",
  "text-fg-muted transition-colors hover:border-border-strong hover:text-fg",
);

/** Paste / Sample / Clear controls that act on a tool's primary input. */
export function InputActions({ onInput, sample, hasInput }: InputActionsProps) {
  async function paste() {
    const text = await readClipboardText();
    if (text != null) onInput(text);
  }

  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        onClick={() => void paste()}
        aria-label="Paste from clipboard"
        title="Paste from clipboard"
        className={buttonClass}
      >
        <ClipboardPaste className="size-3.5" />
      </button>
      {sample !== undefined && (
        <button
          type="button"
          onClick={() => onInput(sample)}
          aria-label="Load sample"
          title="Load sample"
          className={buttonClass}
        >
          <FileText className="size-3.5" />
          Sample
        </button>
      )}
      {hasInput && (
        <button
          type="button"
          onClick={() => onInput("")}
          aria-label="Clear input"
          title="Clear input"
          className={buttonClass}
        >
          <X className="size-3.5" />
        </button>
      )}
    </div>
  );
}
