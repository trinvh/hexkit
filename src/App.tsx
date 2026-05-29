import { useEffect } from "react";
import { AppShell } from "./components/layout/AppShell";
import { useApp } from "./store/app";
import { useDeepLinkNavigation } from "./lib/deeplink";
import { detectFromClipboard } from "./lib/detect";

function App() {
  const togglePalette = useApp((s) => s.togglePalette);
  useDeepLinkNavigation();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === "k") {
        e.preventDefault();
        togglePalette();
      } else if (mod && e.shiftKey && e.key.toLowerCase() === "d") {
        e.preventDefault();
        detectFromClipboard();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [togglePalette]);

  return <AppShell />;
}

export default App;
