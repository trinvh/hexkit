import { useEffect } from "react";
import { AppShell } from "./components/layout/AppShell";
import { useApp } from "./store/app";
import { useDeepLinkNavigation } from "./lib/deeplink";

function App() {
  const togglePalette = useApp((s) => s.togglePalette);
  useDeepLinkNavigation();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        togglePalette();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [togglePalette]);

  return <AppShell />;
}

export default App;
