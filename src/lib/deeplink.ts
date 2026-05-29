import { useEffect } from "react";
import { listen } from "@tauri-apps/api/event";
import { useApp } from "../store/app";
import { toolIdForAction } from "../tools/registry";

/**
 * Navigate to the matching tool when the app is opened via a `hexkit://` deep
 * link. No-op outside the Tauri runtime (e.g. in the browser or tests).
 */
export function useDeepLinkNavigation() {
  useEffect(() => {
    if (!("__TAURI_INTERNALS__" in window)) return;

    let unlisten: (() => void) | undefined;
    listen<string>("deep-link://navigate", (event) => {
      const toolId = toolIdForAction(event.payload);
      if (toolId) useApp.getState().setActiveTool(toolId);
    })
      .then((fn) => {
        unlisten = fn;
      })
      .catch(() => {});

    return () => unlisten?.();
  }, []);
}
