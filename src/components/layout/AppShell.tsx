import { useState } from "react";
import { Toaster } from "sonner";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { TabBar } from "./TabBar";
import { ToolPane } from "./ToolPane";
import { CommandPalette } from "../command-palette/CommandPalette";
import { CliManager } from "../cli/CliManager";
import { AppInfoManager } from "../app/AppInfoManager";
import { UpdateCheckManager } from "../app/UpdateCheckManager";
import { AutoUpdateCheck } from "../app/AutoUpdateCheck";
import { ViewMenuManager } from "../app/ViewMenuManager";
import { SettingsManager } from "../app/SettingsManager";
import { useApp } from "../../store/app";
import { useTheme } from "../../lib/theme";

export function AppShell() {
  const resolved = useTheme((s) => s.resolved);
  const sidebarVisible = useApp((s) => s.sidebarVisible);
  const headerVisible = useApp((s) => s.headerVisible);
  const [cliOpenSignal, setCliOpenSignal] = useState(0);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-canvas text-fg">
      {sidebarVisible && <Sidebar />}
      <div className="flex min-w-0 flex-1 flex-col">
        {headerVisible && (
          <TopBar onOpenCli={() => setCliOpenSignal((n) => n + 1)} />
        )}
        {/* CliManager is a headless dialog host — keep it mounted regardless of
            header visibility so the View/CLI menu items still work. */}
        <CliManager openSignal={cliOpenSignal} />
        <TabBar />
        <main className="min-h-0 flex-1">
          <ToolPane />
        </main>
      </div>
      <CommandPalette />
      <AppInfoManager />
      <UpdateCheckManager />
      <AutoUpdateCheck />
      <ViewMenuManager />
      <SettingsManager />
      <Toaster theme={resolved} position="bottom-right" closeButton />
    </div>
  );
}
