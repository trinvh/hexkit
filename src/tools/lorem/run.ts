import type { SegmentedOption } from "../../components/ui/Segmented";

export type LoremKind = "words" | "paragraphs";

export const LOREM_KINDS: ReadonlyArray<SegmentedOption<LoremKind>> = [
  { value: "words", label: "Words" },
  { value: "paragraphs", label: "Paragraphs" },
];
