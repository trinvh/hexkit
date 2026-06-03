import { useState } from "react";
import { X } from "lucide-react";
import { Segmented } from "../../components/ui/Segmented";
import { TextField } from "../../components/ui/TextField";
import { CopyButton } from "../../components/ui/CopyButton";
import { FileDrop } from "../../components/ui/FileDrop";
import { errorMessage } from "../../lib/ipc";
import { useToolState } from "../../lib/toolState";
import { readFileAsDataUrl } from "../../lib/file";

type Mode = "encode" | "decode";

const MODES = [
  { value: "encode" as const, label: "Image → Base64" },
  { value: "decode" as const, label: "Base64 → Image" },
];

export function Base64ImageTool() {
  const [mode, setMode] = useToolState<Mode>("mode", "encode");
  const [dataUrl, setDataUrl] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function onFile(file: File) {
    try {
      setDataUrl(await readFileAsDataUrl(file));
      setError(null);
    } catch (e) {
      setError(errorMessage(e));
    }
  }

  return (
    <div className="flex h-full flex-col gap-4 p-4">
      <Segmented
        ariaLabel="Base64 image mode"
        options={MODES}
        value={mode}
        onChange={setMode}
      />

      {mode === "encode" ? (
        <>
          <FileDrop
            accept="image/*"
            inputLabel="Image file"
            label="Drop, paste, or click to choose an image"
            hint="PNG, JPG, GIF, SVG, WebP — or paste a screenshot with ⌘/Ctrl+V"
            typeErrorMessage="That doesn't look like an image. Paste or drop a PNG, JPG, GIF, SVG or WebP."
            previewUrl={dataUrl || undefined}
            onFile={onFile}
            onClear={() => {
              setDataUrl("");
              setError(null);
            }}
          />
          {error && <p className="text-sm text-accent">{error}</p>}
          {dataUrl && (
            <div className="flex items-center gap-3">
              <CopyButton value={dataUrl} label="Copy data URI" />
            </div>
          )}
          {dataUrl && (
            <textarea
              readOnly
              aria-label="Base64 data URI"
              value={dataUrl}
              className="min-h-0 flex-1 resize-none rounded-xl border border-border bg-surface p-3 font-mono text-xs text-fg outline-none"
            />
          )}
        </>
      ) : (
        <>
          <TextField
            ariaLabel="Data URI"
            value={dataUrl}
            onChange={setDataUrl}
            placeholder="data:image/png;base64,…"
            mono
          />
          {dataUrl && (
            <button
              type="button"
              onClick={() => setDataUrl("")}
              className="inline-flex w-fit items-center gap-1 rounded-lg border border-border px-2.5 py-1 text-xs text-fg-muted transition-colors hover:border-border-strong hover:text-accent"
            >
              <X className="size-3.5" />
              Clear
            </button>
          )}
          <div className="min-h-0 flex-1 overflow-auto rounded-xl border border-border bg-surface p-4">
            {dataUrl ? (
              <img
                src={dataUrl}
                alt="Decoded preview"
                className="max-h-full max-w-full"
              />
            ) : (
              <p className="text-sm text-fg-subtle">
                Paste a data URI to preview the image.
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
