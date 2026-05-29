import { Pin, PinOff } from "lucide-react";
import type { MenuItem } from "../components/ui/Menu";

/** Pin / unpin actions for a tool, shared by the sidebar and breadcrumb menus. */
export function pinMenuItems(
  id: string,
  pinned: string[],
  togglePinned: (id: string) => void,
): MenuItem[] {
  const isPinned = pinned.includes(id);
  return [
    {
      label: isPinned ? "Unpin" : "Pin to top",
      icon: isPinned ? PinOff : Pin,
      onSelect: () => togglePinned(id),
    },
  ];
}
