import { useEffect } from "react";
import { listen } from "@tauri-apps/api/event";
import { useApp } from "../store/app";
import { toolIdForAction } from "../tools/registry";

interface DeepLinkPayload {
  action: string;
  params: Record<string, unknown>;
}

/**
 * Navigate to the matching tool when the app is opened via a `hexkit://` deep
 * link. If the link carries an `input` query parameter (the convention used
 * by the Raycast extension, the CLI, and the public README), prefill that
 * value into the destination tool. No-op outside the Tauri runtime.
 */
export function useDeepLinkNavigation() {
  useEffect(() => {
    if (!("__TAURI_INTERNALS__" in window)) return;

    let unlisten: (() => void) | undefined;
    listen<DeepLinkPayload>("deep-link://navigate", (event) => {
      const { action, params } = event.payload;
      const toolId = toolIdForAction(action);
      if (!toolId) return;
      const seed = params?.input;
      if (typeof seed === "string" && seed.length > 0) {
        useApp.getState().openToolWithSeed(toolId, seed);
      } else {
        useApp.getState().setActiveTool(toolId);
      }
    })
      .then((fn) => {
        unlisten = fn;
      })
      .catch(() => {});

    return () => unlisten?.();
  }, []);
}
