import { useEffect } from "react";
import { checkForUpdate } from "../../lib/updateCheck";
import { isTauri } from "../../lib/cli";
import { useUpdate } from "../../store/update";

/**
 * Silent background updater. Runs once when the app boots so the sidebar
 * footer can surface "Update available" or a green check next to the
 * version. Failures are swallowed — the user-initiated menu check is the
 * loud path; this one is purely advisory.
 */
export function AutoUpdateCheck() {
  const setResult = useUpdate((s) => s.setResult);

  useEffect(() => {
    if (!isTauri()) return;
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
  }, [setResult]);

  return null;
}
