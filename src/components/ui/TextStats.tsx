import { useMemo } from "react";
import { computeTextStats } from "../../lib/textStats";

interface TextStatsProps {
  value: string;
}

/** Compact status line showing line / word / character counts for a pane. */
export function TextStats({ value }: TextStatsProps) {
  const { chars, words, lines } = useMemo(
    () => computeTextStats(value),
    [value],
  );
  return (
    <div className="flex items-center gap-3 border-t border-border px-3 py-1 text-[11px] tabular-nums text-fg-subtle">
      <span>
        {lines} {lines === 1 ? "line" : "lines"}
      </span>
      <span>
        {words} {words === 1 ? "word" : "words"}
      </span>
      <span>
        {chars} {chars === 1 ? "char" : "chars"}
      </span>
    </div>
  );
}
