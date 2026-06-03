/** Read a File as a base64 `data:` URL via the browser FileReader API. */
export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

/**
 * Does `file` satisfy an HTML `accept` string (e.g. `"image/*"`, `".png,.jpg"`,
 * `"application/json"`)? An empty/absent `accept` matches everything. Used to
 * filter dropped and pasted files the same way the file picker does.
 */
export function fileMatchesAccept(file: File, accept?: string): boolean {
  if (!accept || accept.trim() === "") return true;
  const patterns = accept
    .split(",")
    .map((p) => p.trim().toLowerCase())
    .filter(Boolean);
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();
  return patterns.some((p) => {
    if (p.startsWith(".")) return name.endsWith(p);
    if (p.endsWith("/*")) return type.startsWith(p.slice(0, -1)); // "image/*" -> "image/"
    return type === p;
  });
}

/** First file in `files` that matches `accept`, or null when none do. */
export function pickAcceptedFile(files: ArrayLike<File>, accept?: string): File | null {
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    if (fileMatchesAccept(file, accept)) return file;
  }
  return null;
}
