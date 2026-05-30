import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";

/** Snapshot of the user's CLI install relative to the running app. */
export interface CliStatus {
  installedPath: string | null;
  installedVersion: string | null;
  appVersion: string;
  versionOk: boolean;
  defaultInstallDir: string;
  defaultInstallPath: string;
  installDirOnPath: boolean;
  bundledSidecarAvailable: boolean;
}

export interface InstallReport {
  installedPath: string;
  installedVersion: string | null;
  installDirOnPath: boolean;
  pathHint: string | null;
}

interface RawCliStatus {
  installed_path: string | null;
  installed_version: string | null;
  app_version: string;
  version_ok: boolean;
  default_install_dir: string;
  default_install_path: string;
  install_dir_on_path: boolean;
  bundled_sidecar_available: boolean;
}

interface RawInstallReport {
  installed_path: string;
  installed_version: string | null;
  install_dir_on_path: boolean;
  path_hint: string | null;
}

export async function fetchCliStatus(): Promise<CliStatus> {
  const raw = await invoke<RawCliStatus>("cli_status");
  return normalizeStatus(raw);
}

export async function installCli(): Promise<InstallReport> {
  const raw = await invoke<RawInstallReport>("install_cli");
  return {
    installedPath: raw.installed_path,
    installedVersion: raw.installed_version,
    installDirOnPath: raw.install_dir_on_path,
    pathHint: raw.path_hint,
  };
}

/** Remove the CLI we manage. Returns the path that was (or would have been) removed. */
export async function uninstallCli(): Promise<string> {
  return invoke<string>("uninstall_cli");
}

/** Labels for the macOS app menu's install/uninstall item. */
export const INSTALL_MENU_LABEL = "Install Command Line Tools…";
export const UNINSTALL_MENU_LABEL = "Uninstall Command Line Tools…";

/**
 * Rewrite the macOS app menu's install/uninstall item label. No-op in the
 * browser preview and on non-macOS hosts (where the menu doesn't exist).
 */
export async function setCliMenuLabel(label: string): Promise<void> {
  if (!isTauri()) return;
  try {
    await invoke("set_cli_menu_label", { label });
  } catch {
    // Best-effort UI sync — never block the caller on a menu update.
  }
}

export type CliEventKind = "install-requested" | "show-status";

/** Subscribe to the menu events the Rust side emits. Returns an unlisten fn. */
export async function listenCliEvents(
  handler: (kind: CliEventKind) => void,
): Promise<UnlistenFn> {
  const unInstall = await listen("cli:install-requested", () =>
    handler("install-requested"),
  );
  const unStatus = await listen("cli:show-status", () => handler("show-status"));
  return () => {
    unInstall();
    unStatus();
  };
}

/** True when the app is running inside Tauri (vs. the browser dev preview). */
export function isTauri(): boolean {
  // Tauri injects an internal API marker on window; the simplest check is the
  // presence of the `__TAURI_INTERNALS__` global.
  return (
    typeof globalThis !== "undefined" &&
    typeof (globalThis as { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__ !==
      "undefined"
  );
}

function normalizeStatus(raw: RawCliStatus): CliStatus {
  return {
    installedPath: raw.installed_path,
    installedVersion: raw.installed_version,
    appVersion: raw.app_version,
    versionOk: raw.version_ok,
    defaultInstallDir: raw.default_install_dir,
    defaultInstallPath: raw.default_install_path,
    installDirOnPath: raw.install_dir_on_path,
    bundledSidecarAvailable: raw.bundled_sidecar_available,
  };
}

/** Classification used by the UI to decide pill color + headline copy. */
export type CliState =
  | "unknown" // running in browser preview / no Tauri yet
  | "missing" // not installed at all
  | "outdated" // installed but older than the app
  | "ok"; // installed and at-or-above the app version

export function classify(status: CliStatus | null): CliState {
  if (!status) return "unknown";
  if (!status.installedPath) return "missing";
  return status.versionOk ? "ok" : "outdated";
}
