/**
 * App-wide constants used by the sidebar footer, About dialog, update check
 * and any UI that links back to the project.
 */
export const APP_VERSION = __APP_VERSION__;
export const APP_NAME = "Hexkit";
export const APP_IDENTIFIER = "com.hexkit.app";
export const GITHUB_URL = "https://github.com/trinvh/hexkit";
export const FEEDBACK_URL = `${GITHUB_URL}/issues`;
export const RELEASES_URL = `${GITHUB_URL}/releases`;
export const LATEST_RELEASE_API = `https://api.github.com/repos/trinvh/hexkit/releases/latest`;
export const LICENSE_NAME = "PolyForm Noncommercial 1.0.0";

/**
 * Open `url` in the user's default browser via the Tauri opener plugin, with
 * a `window.open` fallback for the web preview where the plugin is absent.
 */
export async function openExternal(url: string): Promise<void> {
  try {
    const { openUrl } = await import("@tauri-apps/plugin-opener");
    await openUrl(url);
  } catch {
    window.open(url, "_blank", "noopener,noreferrer");
  }
}
