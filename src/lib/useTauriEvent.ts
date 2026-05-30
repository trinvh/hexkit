import { useEffect } from "react";
import { listen, type EventCallback } from "@tauri-apps/api/event";
import { isTauri } from "./cli";

/**
 * Subscribe to a Tauri event with race-safe cleanup.
 *
 * `listen()` returns its disposer asynchronously, so React's StrictMode (and
 * any other rapid mount → unmount → mount cycle) can fire the effect cleanup
 * *before* the disposer is captured — leaking a live listener and causing
 * duplicate handler invocations. This helper tracks a "cancelled" flag so the
 * listener is unsubscribed the moment the disposer arrives.
 *
 * No-ops when running outside Tauri (e.g. the browser preview).
 */
export function useTauriEvent<T>(
  event: string,
  handler: EventCallback<T>,
  deps: ReadonlyArray<unknown> = [],
): void {
  useEffect(() => {
    if (!isTauri()) return;
    let cancelled = false;
    let dispose: (() => void) | null = null;

    void (async () => {
      const off = await listen<T>(event, handler);
      if (cancelled) off();
      else dispose = off;
    })();

    return () => {
      cancelled = true;
      dispose?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event, ...deps]);
}
