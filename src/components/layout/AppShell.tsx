import { Toaster } from "sonner";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { TabBar } from "./TabBar";
import { ToolPane } from "./ToolPane";
import { CommandPalette } from "../command-palette/CommandPalette";
import { useTheme } from "../../lib/theme";

export function AppShell() {
  const resolved = useTheme((s) => s.resolved);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-canvas text-fg">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <TabBar />
        <main className="min-h-0 flex-1">
          <ToolPane />
        </main>
      </div>
      <CommandPalette />
      <Toaster theme={resolved} position="bottom-right" closeButton />
    </div>
  );
}
