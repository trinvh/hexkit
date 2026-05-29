import { useEffect, useRef, useState, type DependencyList } from "react";
import { errorMessage } from "./ipc";

export interface LiveActionState<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
}

/**
 * Run a debounced async computation whenever `deps` change, ignoring results
 * from superseded runs. `compute` returns `null` to signal "nothing to do"
 * (e.g. empty input), which clears the output without an IPC call.
 */
export function useLiveAction<T>(
  compute: () => Promise<T> | null,
  deps: DependencyList,
  delay = 120,
): LiveActionState<T> {
  const [state, setState] = useState<LiveActionState<T>>({
    data: null,
    error: null,
    loading: false,
  });
  const requestId = useRef(0);

  useEffect(() => {
    const id = ++requestId.current;
    const timer = setTimeout(() => {
      const promise = compute();
      if (promise === null) {
        setState({ data: null, error: null, loading: false });
        return;
      }
      setState((prev) => ({ ...prev, loading: true }));
      promise.then(
        (data) => {
          if (id === requestId.current) {
            setState({ data, error: null, loading: false });
          }
        },
        (error: unknown) => {
          if (id === requestId.current) {
            setState({ data: null, error: errorMessage(error), loading: false });
          }
        },
      );
    }, delay);

    return () => clearTimeout(timer);
    // `compute` is intentionally re-created by callers via `deps`.
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps

  return state;
}
