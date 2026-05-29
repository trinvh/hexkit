import { useEffect, useRef } from "react";
import { useApp, type ToolSeed } from "../store/app";

const EMPTY: ToolSeed = { value: "" };

/**
 * Read a one-shot prefill seed for the tool that is mounting. Returns an empty
 * seed when there is none. The seed is cleared after mount so it applies once.
 */
export function useSeed(): ToolSeed {
  const seedRef = useRef<ToolSeed | null>(null);
  if (seedRef.current === null) {
    seedRef.current = useApp.getState().seed ?? EMPTY;
  }

  useEffect(() => {
    if (useApp.getState().seed) useApp.setState({ seed: null });
  }, []);

  return seedRef.current;
}
