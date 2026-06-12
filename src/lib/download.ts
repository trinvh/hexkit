/**
 * Save `content` to a file via a temporary object-URL anchor. Works in the
 * desktop WebView and the browser preview alike, so no Tauri fs plugin is
 * needed for plain text output.
 */
export function downloadText(
  filename: string,
  content: string,
  mime = "text/plain;charset=utf-8",
): void {
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
