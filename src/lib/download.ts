import { invoke } from "@tauri-apps/api/core";
import { toast } from "sonner";

function inTauri(): boolean {
  return "__TAURI_INTERNALS__" in window;
}

/**
 * Save `content` to a file the user chooses.
 *
 * In the desktop app this opens the native "Save As…" dialog so the user picks
 * both the filename and the location, then writes through the `save_file`
 * backend command. In the browser/web preview (no Tauri backend) it falls back
 * to a plain anchor download into the default downloads folder.
 */
export async function downloadText(
  filename: string,
  content: string,
  mime = "text/plain;charset=utf-8",
): Promise<void> {
  if (inTauri()) {
    const { save } = await import("@tauri-apps/plugin-dialog");
    const path = await save({ defaultPath: filename });
    if (!path) return; // user cancelled the dialog
    try {
      await invoke("save_file", { path, contents: content });
      toast.success("File saved");
    } catch (error) {
      toast.error(typeof error === "string" ? error : "Couldn't save file");
    }
    return;
  }
  saveViaAnchor(filename, content, mime);
}

/** Browser fallback: download via a temporary object-URL anchor. */
function saveViaAnchor(filename: string, content: string, mime: string): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
