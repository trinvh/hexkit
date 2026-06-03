import { useEffect } from "react";
import { checkForUpdate } from "../../lib/updateCheck";
import { isTauri } from "../../lib/cli";
import { useApp } from "../../store/app";
import { useUpdate } from "../../store/update";

/**
 * Silent background updater. Runs when the app boots so the sidebar footer can
 * surface "Update available" or a green check next to the version. Skipped when
 * the user has turned off automatic update checks in Settings — the menu's
 * "Check for Updates…" is the loud, always-available path. Failures are
 * swallowed; this one is purely advisory.
 */
export function AutoUpdateCheck() {
  const setResult = useUpdate((s) => s.setResult);
  const autoUpdateCheck = useApp((s) => s.autoUpdateCheck);

  useEffect(() => {
    if (!isTauri() || !autoUpdateCheck) return;
    let cancelled = false;
    void (async () => {
      try {
        const result = await checkForUpdate();
        if (!cancelled) setResult(result);
      } catch {
        // Intentional: keep the launch silent if GitHub is unreachable.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [setResult, autoUpdateCheck]);

  return null;
}
