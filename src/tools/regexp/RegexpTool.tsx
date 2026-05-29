import { useState } from "react";
import { BookOpen } from "lucide-react";
import { TextField } from "../../components/ui/TextField";
import { Toggle } from "../../components/ui/Toggle";
import { CopyButton } from "../../components/ui/CopyButton";
import { CodeEditor } from "../../components/ui/CodeEditor";
import { useLiveAction } from "../../lib/useLiveAction";
import { useSeed } from "../../lib/seed";
import { runRegexp, runReplace } from "./run";

const FLAGS = [
  { key: "i", label: "i" },
  { key: "m", label: "m" },
  { key: "s", label: "s" },
  { key: "x", label: "x" },
] as const;

const CHEAT_SHEET: ReadonlyArray<[token: string, meaning: string]> = [
  ["\\d  \\w  \\s", "digit · word · whitespace"],
  ["\\D  \\W  \\S", "negated classes"],
  [".", "any character"],
  ["^  $", "start · end of line"],
  ["\\b", "word boundary"],
  ["[abc]  [^abc]", "set · negated set"],
  ["a*  a+  a?", "0+ · 1+ · 0 or 1"],
  ["a{2}  a{2,4}", "exactly · range"],
  ["(…)  (?:…)", "capture · non-capturing"],
  ["(?<name>…)", "named group"],
  ["a|b", "alternation"],
  ["(?=…)  (?!…)", "look-ahead · negative"],
];

export function RegexpTool() {
  const seed = useSeed();
  const [pattern, setPattern] = useState(seed.value);
  const [text, setText] = useState("");
  const [flags, setFlags] = useState("");
  const [replacement, setReplacement] = useState("");
  const [showCheatSheet, setShowCheatSheet] = useState(false);

  const { data, error } = useLiveAction(
    () => runRegexp(pattern, text, flags),
    [pattern, text, flags],
  );
  const { data: replaced } = useLiveAction(
    () => runReplace(pattern, text, flags, replacement),
    [pattern, text, flags, replacement],
  );

  const toggleFlag = (flag: string) =>
    setFlags((current) =>
      current.includes(flag)
        ? current.replace(flag, "")
        : current + flag,
    );

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-wrap items-center gap-3 border-b border-border p-4">
        <div className="min-w-64 flex-1">
          <TextField
            ariaLabel="Regular expression"
            value={pattern}
            onChange={setPattern}
            placeholder="\d{3}-\d{4}"
            mono
          />
        </div>
        <div className="flex items-center gap-2">
          {FLAGS.map((flag) => (
            <Toggle
              key={flag.key}
              active={flags.includes(flag.key)}
              onClick={() => toggleFlag(flag.key)}
            >
              {flag.label}
            </Toggle>
          ))}
          <Toggle
            active={showCheatSheet}
            onClick={() => setShowCheatSheet((v) => !v)}
          >
            <BookOpen className="size-3.5" />
          </Toggle>
        </div>
        <div className="min-w-64 flex-1">
          <TextField
            ariaLabel="Replacement"
            value={replacement}
            onChange={setReplacement}
            placeholder="Replacement, e.g. $1-$2 (optional)"
            mono
          />
        </div>
      </div>

      {showCheatSheet && (
        <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 border-b border-border bg-surface px-4 py-3 sm:grid-cols-3 lg:grid-cols-4">
          {CHEAT_SHEET.map(([token, meaning]) => (
            <div key={token} className="flex items-baseline gap-2 text-xs">
              <code className="shrink-0 font-mono text-fg">{token}</code>
              <span className="truncate text-fg-subtle">{meaning}</span>
            </div>
          ))}
        </div>
      )}

      <div className="grid min-h-0 flex-1 grid-cols-2 divide-x divide-border">
        <div className="min-h-0 overflow-hidden">
          <CodeEditor
            value={text}
            onChange={setText}
            ariaLabel="Test text"
            placeholder="Text to match against…"
          />
        </div>
        <div className="min-h-0 overflow-auto p-4">
          {replaced !== null && replaced !== undefined && (
            <div className="mb-3 rounded-lg border border-border bg-surface p-3">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-wider text-fg-subtle">
                  Replaced
                </span>
                <CopyButton value={replaced} label="" />
              </div>
              <pre className="whitespace-pre-wrap break-all font-mono text-sm text-fg">
                {replaced}
              </pre>
            </div>
          )}
          {error ? (
            <p className="text-sm text-accent">{error}</p>
          ) : data && data.matches.length > 0 ? (
            <div className="space-y-2">
              {data.matches.map((match, i) => (
                <div
                  key={i}
                  className="rounded-lg border border-border bg-surface px-3 py-2"
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-mono text-sm text-fg">
                      {match.value}
                    </span>
                    <span className="text-xs text-fg-subtle">
                      at {match.index}
                    </span>
                  </div>
                  {match.groups.length > 0 && (
                    <div className="mt-1 font-mono text-xs text-fg-muted">
                      {match.groups.map((g, gi) => (
                        <span key={gi} className="mr-3">
                          ${gi + 1}: {g ?? "—"}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-fg-subtle">
              {pattern ? "No matches." : "Enter a pattern to test."}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
