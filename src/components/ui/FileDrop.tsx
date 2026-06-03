import {
  useEffect,
  useRef,
  useState,
  type DragEvent,
  type KeyboardEvent,
} from "react";
import { Upload, X, Loader2 } from "lucide-react";
import { cn } from "../../lib/cn";
import { pickAcceptedFile } from "../../lib/file";

interface FileDropProps {
  /**
   * Called with the first accepted file from a browse, drop, or paste. May
   * return a promise; while it's pending the zone shows a spinner.
   */
  onFile: (file: File) => void | Promise<void>;
  /** Accessible label for the hidden file input. */
  inputLabel: string;
  /** HTML accept string; filters browse, drop, and paste alike. */
  accept?: string;
  /** Primary call-to-action text. */
  label?: string;
  /** Secondary helper line. */
  hint?: string;
  /** Message shown when a dropped/pasted file doesn't match `accept`. */
  typeErrorMessage?: string;
  /**
   * When set, an image `data:`/URL to preview inside the zone (the picked file).
   * The zone stays interactive so the image can be replaced by another
   * drop/paste/browse.
   */
  previewUrl?: string;
  /** When set, a "Clear" button is shown alongside the preview to reset it. */
  onClear?: () => void;
  /**
   * Listen for clipboard paste while mounted (default true). A paste is acted on
   * only when the clipboard carries a file — plain-text paste is left alone so
   * it still reaches focused text inputs.
   */
  pasteEnabled?: boolean;
  className?: string;
}

/**
 * A dropzone that accepts a file three ways: click to browse, drag-and-drop, or
 * paste from the clipboard (e.g. a screenshot via Cmd/Ctrl+V — no need to save
 * it to disk first). Drag-and-drop relies on the webview's native HTML5 DnD,
 * which requires `dragDropEnabled: false` on the Tauri window.
 *
 * While `onFile` resolves it shows a spinner; if a dropped/pasted file isn't an
 * accepted type it shows an error instead.
 */
export function FileDrop({
  onFile,
  inputLabel,
  accept,
  label = "Drop, paste, or click to browse",
  hint,
  typeErrorMessage = "Unsupported file type.",
  previewUrl,
  onClear,
  pasteEnabled = true,
  className,
}: FileDropProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [typeError, setTypeError] = useState<string | null>(null);

  /** Process a gesture's files. Returns true when files were present. */
  function run(files: File[]): boolean {
    if (files.length === 0) return false;
    const match = pickAcceptedFile(files, accept);
    if (!match) {
      setTypeError(typeErrorMessage);
      return true;
    }
    setTypeError(null);
    setBusy(true);
    Promise.resolve(onFile(match))
      .catch(() => {
        // The caller surfaces its own processing error; just stop spinning.
      })
      .finally(() => setBusy(false));
    return true;
  }

  // Keep the latest run() reachable from the window paste listener without
  // re-subscribing on every render.
  const runRef = useRef(run);
  runRef.current = run;

  useEffect(() => {
    if (!pasteEnabled) return;
    function onPaste(event: ClipboardEvent) {
      if (!event.clipboardData) return;
      const files = collectFiles(event.clipboardData);
      // Only consume the paste when it carried a file; let text paste reach
      // whatever input is focused.
      if (files.length > 0) {
        event.preventDefault();
        runRef.current(files);
      }
    }
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [pasteEnabled]);

  function onDrop(event: DragEvent) {
    event.preventDefault();
    setDragging(false);
    run(collectFiles(event.dataTransfer));
  }

  function onKeyDown(event: KeyboardEvent) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      inputRef.current?.click();
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={onKeyDown}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        aria-busy={busy}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed px-6 py-8 text-center transition-colors",
          dragging
            ? "border-accent bg-accent/8 text-fg"
            : "border-border text-fg-muted hover:border-border-strong hover:text-fg",
          className,
        )}
      >
        {busy ? (
          <>
            <Loader2 className="size-5 animate-spin text-fg-subtle" />
            <span className="text-sm">Processing…</span>
          </>
        ) : previewUrl ? (
          <>
            <img
              src={previewUrl}
              alt="Selected file preview"
              className="max-h-48 max-w-full rounded-md object-contain"
            />
            <span className="text-xs text-fg-subtle">Drop, paste, or click to replace</span>
            {onClear && (
              <button
                type="button"
                aria-label="Clear"
                title="Clear"
                onClick={(e) => {
                  e.stopPropagation();
                  setTypeError(null);
                  onClear();
                }}
                className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1 text-xs text-fg-muted transition-colors hover:border-border-strong hover:text-accent"
              >
                <X className="size-3.5" />
                Clear
              </button>
            )}
          </>
        ) : (
          <>
            <Upload className="size-5 text-fg-subtle" />
            <span className="text-sm">{label}</span>
            {hint && <span className="text-xs text-fg-subtle">{hint}</span>}
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          aria-label={inputLabel}
          className="hidden"
          // The hidden input's programmatic click would otherwise bubble back to
          // the wrapper's onClick and re-open the dialog.
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => {
            run(Array.from(e.currentTarget.files ?? []));
            // Allow re-selecting the same file.
            e.currentTarget.value = "";
          }}
        />
      </div>
      {typeError && <p className="text-sm text-accent">{typeError}</p>}
    </div>
  );
}

/**
 * Gather files from a DataTransfer (drop) or DataTransferList (paste). Items are
 * preferred because some webviews expose a pasted image only via `items`, not
 * `files`; we fall back to `files` when items yield nothing.
 */
function collectFiles(dt: DataTransfer | null): File[] {
  if (!dt) return [];
  const out: File[] = [];
  if (dt.items && dt.items.length > 0) {
    for (let i = 0; i < dt.items.length; i++) {
      const item = dt.items[i];
      if (item.kind === "file") {
        const file = item.getAsFile();
        if (file) out.push(file);
      }
    }
  }
  if (out.length === 0 && dt.files) {
    for (let i = 0; i < dt.files.length; i++) out.push(dt.files[i]);
  }
  return out;
}
