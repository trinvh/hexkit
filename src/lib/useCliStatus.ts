import { useCallback, useEffect, useState } from "react";
import {
  classify,
  fetchCliStatus,
  isTauri,
  setCliMenuLabel,
  INSTALL_MENU_LABEL,
  UNINSTALL_MENU_LABEL,
  type CliState,
  type CliStatus,
} from "./cli";

export interface UseCliStatus {
  status: CliStatus | null;
  state: CliState;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * Fetch the Hexkit CLI install status from the Tauri backend, with refresh().
 * In the browser preview (no Tauri runtime) the hook reports `state: "unknown"`
 * and never throws.
 */
export function useCliStatus(): UseCliStatus {
  const [status, setStatus] = useState<CliStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!isTauri()) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const next = await fetchCliStatus();
      setStatus(next);
      setError(null);
      // Sync the macOS app menu label to match the install state. We only
      // offer "Uninstall…" when the installed binary is the one we manage —
      // see CliManager for the matching dialog behaviour.
      const managedByUs =
        !!next.installedPath &&
        normalizePath(next.installedPath) ===
          normalizePath(next.defaultInstallPath);
      void setCliMenuLabel(
        managedByUs ? UNINSTALL_MENU_LABEL : INSTALL_MENU_LABEL,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { status, state: classify(status), loading, error, refresh };
}

function normalizePath(p: string): string {
  return p.replace(/\/+$/g, "");
}
