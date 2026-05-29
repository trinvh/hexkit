import { useState, type ChangeEvent } from "react";
import { Upload } from "lucide-react";
import { Segmented } from "../../components/ui/Segmented";
import { TextField } from "../../components/ui/TextField";
import { CopyButton } from "../../components/ui/CopyButton";
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

  async function onFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
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
          <label className="inline-flex w-fit cursor-pointer items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs text-fg-muted transition-colors hover:border-border-strong hover:text-fg">
            <Upload className="size-3.5" />
            Choose image
            <input
              type="file"
              accept="image/*"
              aria-label="Image file"
              className="hidden"
              onChange={onFile}
            />
          </label>
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
