import { useMemo, useState } from "react";
import { CodeEditor } from "../../components/ui/CodeEditor";
import { CopyButton } from "../../components/ui/CopyButton";
import { Segmented } from "../../components/ui/Segmented";
import { cn } from "../../lib/cn";
import { isLargeText } from "../../lib/largeText";
import { formatBytes, languageForContentType, prettyJson, statusClass } from "./run";
import type { HttpResponse } from "./types";

interface ResponseViewProps {
  response: HttpResponse | null;
  error: string | null;
  loading: boolean;
}

type Pane = "body" | "headers";

export function ResponseView({ response, error, loading }: ResponseViewProps) {
  const [pane, setPane] = useState<Pane>("body");

  const contentType = useMemo(
    () => response?.headers.find(([k]) => k.toLowerCase() === "content-type")?.[1],
    [response],
  );
  const language = languageForContentType(contentType);
  const prettyBody = useMemo(() => {
    if (!response || response.bodyBase64) return response?.body ?? "";
    // Don't re-parse/serialize a huge body — it blocks the main thread and the
    // editor won't highlight it anyway.
    if (isLargeText(response.body)) return response.body;
    return language === "json" ? prettyJson(response.body) : response.body;
  }, [response, language]);

  if (loading) {
    return <Centered>Sending request…</Centered>;
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="rounded-lg border border-border-strong bg-surface px-4 py-3 text-sm">
          <span className="font-medium text-accent">Request failed</span>
          <span className="ml-2 text-fg-muted">{error}</span>
        </div>
      </div>
    );
  }

  if (!response) {
    return <Centered>Send a request to see the response here.</Centered>;
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 border-b border-border px-4 py-2.5 text-xs">
        <span className={cn("font-semibold tabular-nums", statusClass(response.status))}>
          {response.status} {response.statusText}
        </span>
        <span className="text-fg-subtle">
          <span className="text-fg-muted">{response.elapsedMs}</span> ms
        </span>
        <span className="text-fg-subtle">
          <span className="text-fg-muted">{formatBytes(response.sizeBytes)}</span>
        </span>
        {response.truncated && (
          <span className="text-amber-500">truncated at 10 MB</span>
        )}
        <div className="ml-auto flex items-center gap-2">
          <Segmented
            ariaLabel="Response pane"
            options={[
              { value: "body", label: "Body" },
              { value: "headers", label: `Headers (${response.headers.length})` },
            ]}
            value={pane}
            onChange={setPane}
          />
          <CopyButton value={pane === "body" ? prettyBody : formatHeaders(response.headers)} label="" />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto">
        {pane === "body" ? (
          response.bodyBase64 ? (
            <BinaryNotice response={response} />
          ) : (
            <div className="h-full px-1">
              <CodeEditor
                value={prettyBody}
                readOnly
                language={language}
                ariaLabel="Response body"
              />
            </div>
          )
        ) : (
          <HeaderTable headers={response.headers} />
        )}
      </div>
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full items-center justify-center p-6 text-center text-sm text-fg-subtle">
      {children}
    </div>
  );
}

function HeaderTable({ headers }: { headers: [string, string][] }) {
  if (headers.length === 0) {
    return <p className="p-4 text-sm text-fg-subtle">No response headers.</p>;
  }
  return (
    <div className="divide-y divide-border">
      {headers.map(([key, value], i) => (
        <div key={`${key}-${i}`} className="flex gap-3 px-4 py-2 text-xs">
          <span className="w-2/5 shrink-0 break-all font-mono font-medium text-fg-muted">
            {key}
          </span>
          <span className="min-w-0 flex-1 break-all font-mono text-fg">{value}</span>
        </div>
      ))}
    </div>
  );
}

function BinaryNotice({ response }: { response: HttpResponse }) {
  return (
    <div className="p-4 text-sm text-fg-muted">
      <p>Binary response ({formatBytes(response.sizeBytes)}). Showing base64.</p>
      <p className="mt-2 break-all font-mono text-xs text-fg-subtle">
        {response.body.slice(0, 2000)}
        {response.body.length > 2000 ? "…" : ""}
      </p>
    </div>
  );
}

function formatHeaders(headers: [string, string][]): string {
  return headers.map(([k, v]) => `${k}: ${v}`).join("\n");
}
