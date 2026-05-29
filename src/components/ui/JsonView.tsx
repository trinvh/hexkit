import { cn } from "../../lib/cn";

export type JsonTokenKind =
  | "key"
  | "string"
  | "number"
  | "keyword"
  | "punct"
  | "plain";

export interface JsonToken {
  text: string;
  kind: JsonTokenKind;
}

const TOKEN_RE =
  /"(?:\\.|[^"\\])*"|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?|\btrue\b|\bfalse\b|\bnull\b|[{}[\],:]|\s+/g;

/**
 * Split a (pretty-printed) JSON string into colour-coded tokens. Concatenating
 * the token text reproduces the input exactly, so it is safe for display.
 */
export function tokenizeJson(json: string): JsonToken[] {
  const tokens: JsonToken[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  const re = new RegExp(TOKEN_RE);

  while ((match = re.exec(json)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({ text: json.slice(lastIndex, match.index), kind: "plain" });
    }
    const text = match[0];
    tokens.push({ text, kind: classify(text, json.slice(re.lastIndex)) });
    lastIndex = re.lastIndex;
  }
  if (lastIndex < json.length) {
    tokens.push({ text: json.slice(lastIndex), kind: "plain" });
  }
  return tokens;
}

function classify(text: string, rest: string): JsonTokenKind {
  if (text.startsWith('"')) {
    // A string immediately followed by a colon is an object key.
    return /^\s*:/.test(rest) ? "key" : "string";
  }
  if (/^\s+$/.test(text)) return "plain";
  if (text === "true" || text === "false" || text === "null") return "keyword";
  if (/^[{}[\],:]$/.test(text)) return "punct";
  return "number";
}

// Mirrors the CodeMirror highlight style so inline JSON matches the editors.
const COLOR: Record<JsonTokenKind, string | undefined> = {
  key: "var(--cm-key)",
  string: "var(--cm-string)",
  number: "var(--cm-number)",
  keyword: "var(--cm-number)",
  punct: "var(--fg-subtle)",
  plain: undefined,
};

interface JsonViewProps {
  value: string;
  ariaLabel?: string;
  className?: string;
}

/** Read-only, syntax-highlighted JSON for inline display panels. */
export function JsonView({ value, ariaLabel, className }: JsonViewProps) {
  return (
    <pre
      aria-label={ariaLabel}
      className={cn(
        "overflow-x-auto whitespace-pre-wrap break-all font-mono text-xs text-fg",
        className,
      )}
    >
      {tokenizeJson(value).map((token, index) =>
        token.kind === "plain" ? (
          token.text
        ) : (
          <span key={index} style={{ color: COLOR[token.kind] }}>
            {token.text}
          </span>
        ),
      )}
    </pre>
  );
}
