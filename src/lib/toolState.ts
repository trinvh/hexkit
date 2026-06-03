import { useEffect, useRef, useState } from "react";
import { useApp } from "../store/app";
import { isLargeText } from "./largeText";
import { useTabId } from "./tabContext";

const DEBOUNCE_MS = 300;

/**
 * Like `useState`, but the value is persisted per tab (keyed by the surrounding
 * TabContext) so it survives tab switches and app restarts. Writes are
 * debounced and flushed on unmount; nothing is written for tabs that have been
 * closed. Use for inputs and option selections — not derived outputs.
 */
type Updater<T> = T | ((prev: T) => T);

export function useToolState<T>(
  field: string,
  initial: T,
): [T, (value: Updater<T>) => void] {
  const tabId = useTabId();
  const [value, setValue] = useState<T>(() => {
    const stored = useApp.getState().tabState[tabId]?.[field];
    return stored === undefined ? initial : (stored as T);
  });
  const latest = useRef(value);
  const dirty = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const commit = () => {
    if (!dirty.current) return;
    const state = useApp.getState();
    // Don't resurrect state for a tab that was closed.
    if (!state.tabs.some((tab) => tab.id === tabId)) return;
    const value = latest.current;
    // Large text values (e.g. a multi-MB request body) are NOT persisted:
    // JSON.stringify-ing megabytes into localStorage on every debounced commit
    // blocks the main thread and freezes the UI. They live in React state for
    // the session instead. Clear any previously persisted value so a reload
    // doesn't restore a stale, smaller one.
    if (typeof value === "string" && isLargeText(value)) {
      if (state.tabState[tabId]?.[field] !== undefined) {
        state.setTabField(tabId, field, undefined);
      }
      return;
    }
    state.setTabField(tabId, field, value);
  };

  const set = (next: Updater<T>) => {
    const resolved =
      typeof next === "function"
        ? (next as (prev: T) => T)(latest.current)
        : next;
    latest.current = resolved;
    dirty.current = true;
    setValue(resolved);
    clearTimeout(timer.current);
    timer.current = setTimeout(commit, DEBOUNCE_MS);
  };

  useEffect(() => {
    return () => {
      clearTimeout(timer.current);
      commit();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return [value, set];
}
