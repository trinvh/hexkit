import { useState } from "react";
import { Globe, Send, Download, ChevronDown, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { CodeEditor } from "../../components/ui/CodeEditor";
import { Segmented } from "../../components/ui/Segmented";
import { TextField } from "../../components/ui/TextField";
import { cn } from "../../lib/cn";
import { errorMessage } from "../../lib/ipc";
import { useSeed } from "../../lib/seed";
import { useToolState } from "../../lib/toolState";
import { KeyValueEditor } from "./KeyValueEditor";
import { ResponseView } from "./ResponseView";
import { fromCurl, sendRequest, toCode, toCurl } from "./api";
import {
  activeCount,
  BODY_TYPES,
  buildBody,
  buildRequest,
  CODE_TARGETS,
  METHODS,
  type CodeTarget,
} from "./run";
import type { Body, BodyType, HttpRequest, HttpResponse, Param } from "./types";

type ReqTab = "params" | "headers" | "body";

const DEFAULT_RAW_CONTENT_TYPE = "application/json";

export function HttpClientTool() {
  const seed = useSeed();

  const [method, setMethod] = useToolState("method", "GET");
  const [url, setUrl] = useToolState("url", "");
  const [query, setQuery] = useToolState<Param[]>("query", []);
  const [headers, setHeaders] = useToolState<Param[]>("headers", []);
  const [bodyType, setBodyType] = useToolState<BodyType>("bodyType", "none");
  const [raw, setRaw] = useToolState("raw", "");
  const [rawContentType, setRawContentType] = useToolState(
    "rawContentType",
    DEFAULT_RAW_CONTENT_TYPE,
  );
  const [formFields, setFormFields] = useToolState<Param[]>("formFields", []);
  const [multipartFields, setMultipartFields] = useToolState<Param[]>("multipartFields", []);
  const [reqTab, setReqTab] = useToolState<ReqTab>("reqTab", "params");

  const [importOpen, setImportOpen] = useState(seed.value.trim() !== "");
  const [importText, setImportText] = useState(seed.value);
  const [importing, setImporting] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  const [response, setResponse] = useState<HttpResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function currentBody(): Body {
    return buildBody(bodyType, raw, rawContentType, formFields, multipartFields);
  }

  function currentRequest(): HttpRequest {
    return buildRequest({ method, url, query, headers, body: currentBody() });
  }

  function applyRequest(req: HttpRequest) {
    setMethod(req.method);
    setUrl(req.url);
    setQuery(req.query);
    setHeaders(req.headers);
    setBodyType(req.body.type);
    if (req.body.type === "raw") {
      setRaw(req.body.content);
      setRawContentType(req.body.contentType || DEFAULT_RAW_CONTENT_TYPE);
    } else if (req.body.type === "form") {
      setFormFields(req.body.fields);
    } else if (req.body.type === "multipart") {
      setMultipartFields(req.body.fields);
    }
    if (req.body.type !== "none") setReqTab("body");
    else if (req.query.length > 0) setReqTab("params");
  }

  async function onImport() {
    if (importText.trim() === "" || importing) return;
    setImporting(true);
    try {
      applyRequest(await fromCurl(importText));
      setImportOpen(false);
      setImportText("");
      toast.success("Imported cURL command");
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setImporting(false);
    }
  }

  async function onSend() {
    if (url.trim() === "") return;
    setLoading(true);
    setError(null);
    try {
      setResponse(await sendRequest(currentRequest()));
    } catch (e) {
      setError(errorMessage(e));
      setResponse(null);
    } finally {
      setLoading(false);
    }
  }

  async function onExportCurl() {
    setExportOpen(false);
    setExporting(true);
    try {
      await navigator.clipboard.writeText(await toCurl(currentRequest()));
      toast.success("Copied as cURL");
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setExporting(false);
    }
  }

  async function onExportCode(target: CodeTarget) {
    setExportOpen(false);
    setExporting(true);
    try {
      await navigator.clipboard.writeText(await toCode(currentRequest(), target));
      toast.success(`Copied as ${target}`);
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Request bar */}
      <div className="flex flex-col gap-2 border-b border-border p-3">
        <div className="flex items-center gap-2">
          <span
            title="This tool makes real network requests — the one exception to Hexkit's offline design."
            className="inline-flex shrink-0 items-center gap-1 rounded-md border border-amber-500/40 bg-amber-500/10 px-2 py-1 text-[11px] font-medium text-amber-600 dark:text-amber-400"
          >
            <Globe className="size-3" />
            Online
          </span>
          <div className="relative shrink-0">
            <select
              value={method}
              onChange={(e) => setMethod(e.currentTarget.value)}
              aria-label="HTTP method"
              className="h-10 cursor-pointer appearance-none rounded-lg border border-border bg-surface pl-3 pr-8 text-sm font-medium text-fg outline-none focus:border-border-strong"
            >
              {METHODS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 size-4 -translate-y-1/2 text-fg-subtle" />
          </div>
          <div className="min-w-0 flex-1">
            <TextField
              ariaLabel="Request URL"
              value={url}
              onChange={setUrl}
              placeholder="https://api.example.com/users"
              mono
            />
          </div>
          <button
            type="button"
            onClick={onSend}
            disabled={url.trim() === "" || loading}
            className={cn(
              "inline-flex h-10 shrink-0 items-center gap-1.5 rounded-lg bg-accent px-4 text-sm font-medium text-accent-fg transition-opacity",
              "hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40",
            )}
          >
            {loading ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Send className="size-3.5" />
            )}
            {loading ? "Sending…" : "Send"}
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setImportOpen((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1 text-xs text-fg-muted transition-colors hover:border-border-strong hover:text-fg"
          >
            Import cURL
          </button>
          <div className="relative">
            <button
              type="button"
              onClick={() => setExportOpen((v) => !v)}
              disabled={exporting}
              aria-haspopup="menu"
              aria-expanded={exportOpen}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1 text-xs text-fg-muted transition-colors hover:border-border-strong hover:text-fg disabled:opacity-50"
            >
              {exporting ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Download className="size-3.5" />
              )}
              Export
              <ChevronDown className="size-3" />
            </button>
            {exportOpen && (
              <div
                role="menu"
                className="absolute left-0 top-full z-20 mt-1 min-w-36 overflow-hidden rounded-lg border border-border bg-surface py-1 shadow-lg"
              >
                <ExportItem label="cURL" onSelect={onExportCurl} />
                <div className="my-1 border-t border-border" />
                {CODE_TARGETS.map((t) => (
                  <ExportItem
                    key={t.value}
                    label={t.label}
                    onSelect={() => onExportCode(t.value)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {importOpen && (
          <div className="flex flex-col gap-2 rounded-lg border border-border bg-canvas p-2">
            <textarea
              value={importText}
              onChange={(e) => setImportText(e.currentTarget.value)}
              aria-label="cURL command to import"
              placeholder="Paste a curl command…"
              rows={3}
              className="w-full resize-y rounded-md border border-border bg-surface p-2 font-mono text-xs text-fg outline-none placeholder:text-fg-subtle focus:border-border-strong"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onImport}
                disabled={importText.trim() === "" || importing}
                className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1 text-xs font-medium text-accent-fg transition-opacity hover:opacity-90 disabled:opacity-40"
              >
                {importing && <Loader2 className="size-3.5 animate-spin" />}
                {importing ? "Importing…" : "Import"}
              </button>
              <button
                type="button"
                onClick={() => setImportOpen(false)}
                className="rounded-lg border border-border px-3 py-1 text-xs text-fg-muted transition-colors hover:text-fg"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Request editor + response, split vertically */}
      <div className="grid min-h-0 flex-1 grid-rows-2 divide-y divide-border">
        <div className="flex min-h-0 flex-col">
          <div className="px-3 pt-3">
            <Segmented
              ariaLabel="Request section"
              options={[
                { value: "params", label: `Params${count(activeCount(query))}` },
                { value: "headers", label: `Headers${count(activeCount(headers))}` },
                { value: "body", label: bodyType === "none" ? "Body" : "Body •" },
              ]}
              value={reqTab}
              onChange={setReqTab}
            />
          </div>
          <div className="min-h-0 flex-1 overflow-auto p-3">
            {reqTab === "params" && (
              <KeyValueEditor
                label="Query param"
                rows={query}
                onChange={setQuery}
                keyPlaceholder="Parameter"
              />
            )}
            {reqTab === "headers" && (
              <KeyValueEditor
                label="Header"
                rows={headers}
                onChange={setHeaders}
                keyPlaceholder="Header"
              />
            )}
            {reqTab === "body" && (
              <div className="flex h-full flex-col gap-3">
                <div className="flex items-center gap-2">
                  <Segmented
                    ariaLabel="Body type"
                    options={BODY_TYPES}
                    value={bodyType}
                    onChange={setBodyType}
                  />
                  {bodyType === "raw" && (
                    <input
                      type="text"
                      value={rawContentType}
                      onChange={(e) => setRawContentType(e.currentTarget.value)}
                      aria-label="Content type"
                      placeholder="Content-Type"
                      className="h-8 w-56 rounded-lg border border-border bg-surface px-2.5 font-mono text-xs text-fg outline-none focus:border-border-strong"
                    />
                  )}
                </div>
                {bodyType === "none" && (
                  <p className="text-sm text-fg-subtle">This request has no body.</p>
                )}
                {bodyType === "raw" && (
                  <div className="min-h-0 flex-1 rounded-lg border border-border">
                    <CodeEditor
                      value={raw}
                      onChange={setRaw}
                      language={rawContentType.includes("json") ? "json" : undefined}
                      placeholder='{ "key": "value" }'
                      ariaLabel="Raw body"
                    />
                  </div>
                )}
                {bodyType === "form" && (
                  <KeyValueEditor label="Form field" rows={formFields} onChange={setFormFields} />
                )}
                {bodyType === "multipart" && (
                  <KeyValueEditor
                    label="Multipart field"
                    rows={multipartFields}
                    onChange={setMultipartFields}
                  />
                )}
              </div>
            )}
          </div>
        </div>

        <div className="min-h-0">
          <ResponseView response={response} error={error} loading={loading} />
        </div>
      </div>
    </div>
  );
}

function count(n: number): string {
  return n > 0 ? ` (${n})` : "";
}

function ExportItem({ label, onSelect }: { label: string; onSelect: () => void }) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onSelect}
      className="block w-full px-3 py-1.5 text-left text-xs text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg"
    >
      {label}
    </button>
  );
}
