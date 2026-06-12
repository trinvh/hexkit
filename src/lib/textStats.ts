export interface TextStatsResult {
  /** UTF-16 code unit count (JS string length). */
  chars: number;
  /** Whitespace-separated word count. */
  words: number;
  /** Line count (0 for empty, otherwise newline-separated segments). */
  lines: number;
}

/** Character, word and line counts for a tool's status line. */
export function computeTextStats(value: string): TextStatsResult {
  const trimmed = value.trim();
  return {
    chars: value.length,
    words: trimmed === "" ? 0 : trimmed.split(/\s+/).length,
    lines: value === "" ? 0 : value.split(/\r\n|\r|\n/).length,
  };
}
