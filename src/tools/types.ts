import type { ComponentType, LazyExoticComponent } from "react";
import type { LucideIcon } from "lucide-react";

export type ToolCategory =
  | "Formatters"
  | "Encoders"
  | "Converters"
  | "Generators"
  | "Cryptography"
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
  /** Tool view (lazy-loaded). Absent while the tool is still scaffolded. */
  component?: ComponentType | LazyExoticComponent<ComponentType>;
  /**
   * Marks a tool that makes real network requests — the deliberate exception to
   * Hexkit's offline design. Surfaced as a badge in the sidebar so it's honest
   * about leaving the machine.
   */
  networked?: boolean;
}

/** Display + grouping order for categories in the sidebar. */
export const CATEGORY_ORDER: ToolCategory[] = [
  "Formatters",
  "Encoders",
  "Converters",
  "Generators",
  "Cryptography",
  "Text",
  "Web",
];
