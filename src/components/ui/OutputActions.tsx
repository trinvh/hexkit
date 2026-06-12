import { useState } from "react";
import { Binary, Download, Hexagon, MoreHorizontal } from "lucide-react";
import { CopyButton } from "./CopyButton";
import { Menu, type MenuItem } from "./Menu";
import { useApp } from "../../store/app";
import { downloadText } from "../../lib/download";
import { cn } from "../../lib/cn";

interface OutputActionsProps {
  /** The output text these actions operate on. */
  value: string;
  /** Label for the copy button. */
  copyLabel?: string;
  /** Filename used by the Download action. */
  downloadName?: string;
}

/**
 * Copy-output button paired with a three-dot menu of follow-up actions:
 * hand the output off to the Base64 or Hex tool in a new tab, or download it.
 * Shared across tools so new actions only need to be added here.
 */
export function OutputActions({
  value,
  copyLabel = "Copy output",
  downloadName = "output.txt",
}: OutputActionsProps) {
  const openInNewTabWithSeed = useApp((s) => s.openInNewTabWithSeed);
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);

  function openMenu(event: React.MouseEvent<HTMLButtonElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    // Anchor to the button's right edge; Menu clamps itself into the viewport.
    setMenu({ x: rect.right, y: rect.bottom + 4 });
  }

  const items: MenuItem[] = [
    {
      label: "Convert to Base64",
      icon: Binary,
      onSelect: () => openInNewTabWithSeed("base64-string", value, "encode"),
    },
    {
      label: "Convert to Hex",
      icon: Hexagon,
      onSelect: () => openInNewTabWithSeed("hex-ascii", value, "encode"),
    },
    {
      label: "Download",
      icon: Download,
      onSelect: () => void downloadText(downloadName, value),
    },
  ];

  return (
    <div className="flex items-center gap-1.5">
      <CopyButton value={value} label={copyLabel} />
      <button
        type="button"
        onClick={openMenu}
        disabled={!value}
        aria-label="More output actions"
        aria-haspopup="menu"
        aria-expanded={menu !== null}
        title="More actions"
        className={cn(
          "inline-flex items-center justify-center rounded-lg border border-border px-1.5 py-1",
          "text-fg-muted transition-colors hover:border-border-strong hover:text-fg",
          "disabled:cursor-not-allowed disabled:opacity-40",
        )}
      >
        <MoreHorizontal className="size-3.5" />
      </button>
      {menu && (
        <Menu
          x={menu.x}
          y={menu.y}
          items={items}
          onClose={() => setMenu(null)}
        />
      )}
    </div>
  );
}
