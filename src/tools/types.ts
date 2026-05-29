import type { ComponentType } from "react";
import type { LucideIcon } from "lucide-react";

export type ToolCategory =
  | "Formatters"
  | "Encoders"
  | "Converters"
  | "Generators"
  | "Text"
  | "Web";

export interface ToolDefinition {
  /** Stable identifier, also used as the route key. */
  id: string;
  name: string;
  category: ToolCategory;
  /** One-line description shown in the top bar and command palette. */
  description: string;
  /** Extra search terms for the command palette and sidebar filter. */
  keywords: string[];
  icon: LucideIcon;
  /** Tool view. Absent while the tool is still scaffolded (Phase 3). */
  component?: ComponentType;
}

/** Display + grouping order for categories in the sidebar. */
export const CATEGORY_ORDER: ToolCategory[] = [
  "Formatters",
  "Encoders",
  "Converters",
  "Generators",
  "Text",
  "Web",
];
