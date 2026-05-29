import { toast } from "sonner";
import { runAction } from "./ipc";
import { useApp } from "../store/app";
import { toolIdForKind } from "../tools/registry";
import { readClipboardText } from "./clipboard";

export interface Detection {
  kind: string;
  mode?: string;
}

export function detectInput(input: string): Promise<Detection | null> {
  return runAction<Detection | null>("detect.run", { input });
}

export interface SmartDetectDeps {
  readClipboard: () => Promise<string | null>;
  detect: (input: string) => Promise<Detection | null>;
  resolveTool: (kind: string) => string | undefined;
  open: (toolId: string, value: string, mode?: string) => void;
  notify: (message: string) => void;
}

/** Read the clipboard, detect its kind, and open the matching tool prefilled. */
export async function runSmartDetect(deps: SmartDetectDeps): Promise<void> {
  let text: string | null;
  try {
    text = await deps.readClipboard();
  } catch {
    deps.notify("Couldn't read the clipboard");
    return;
  }

  if (!text || text.trim() === "") {
    deps.notify("Clipboard is empty");
    return;
  }

  let detection: Detection | null;
  try {
    detection = await deps.detect(text);
  } catch {
    deps.notify("Detection failed");
    return;
  }

  const toolId = detection ? deps.resolveTool(detection.kind) : undefined;
  if (!detection || !toolId) {
    deps.notify("No tool matched the clipboard");
    return;
  }

  deps.open(toolId, text, detection.mode);
}

/** Wire `runSmartDetect` to the real clipboard, backend, store, and toasts. */
export function detectFromClipboard(): void {
  void runSmartDetect({
    readClipboard: readClipboardText,
    detect: detectInput,
    resolveTool: toolIdForKind,
    open: useApp.getState().openToolWithSeed,
    notify: (message) => {
      toast(message);
    },
  });
}
