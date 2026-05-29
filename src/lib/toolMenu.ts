import { Pin, PinOff, SquarePlus } from "lucide-react";
import type { MenuItem } from "../components/ui/Menu";

/** Pin/unpin (and optionally open-in-new-tab) actions for a tool, shared by
 *  the sidebar context menu and the breadcrumb menu. */
export function pinMenuItems(
  id: string,
  pinned: string[],
  togglePinned: (id: string) => void,
  openInNewTab?: (id: string) => void,
): MenuItem[] {
  const isPinned = pinned.includes(id);
  const items: MenuItem[] = [
    {
      label: isPinned ? "Unpin" : "Pin to top",
      icon: isPinned ? PinOff : Pin,
      onSelect: () => togglePinned(id),
    },
  ];
  if (openInNewTab) {
    items.push({
      label: "Open in new tab",
      icon: SquarePlus,
      onSelect: () => openInNewTab(id),
    });
  }
  return items;
}
