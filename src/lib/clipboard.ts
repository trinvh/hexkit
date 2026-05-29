/** Read the clipboard's text via the Tauri plugin, falling back to the web API. */
export async function readClipboardText(): Promise<string | null> {
  if ("__TAURI_INTERNALS__" in window) {
    const { readText } = await import("@tauri-apps/plugin-clipboard-manager");
    return await readText();
  }
  if (navigator.clipboard?.readText) {
    return await navigator.clipboard.readText();
  }
  return null;
}
