import {
  Braces,
  Binary,
  KeyRound,
  Link,
  Globe,
  Clock,
  Hash,
  Fingerprint,
  CaseSensitive,
  GitCompare,
  Code,
  Calculator,
} from "lucide-react";
import type { ToolDefinition } from "./types";
import { JsonTool } from "./json/JsonTool";
import { Base64Tool } from "./base64/Base64Tool";
import { UrlTool } from "./url/UrlTool";
import { HtmlTool } from "./html/HtmlTool";
import { NumberTool } from "./number/NumberTool";
import { CaseTool } from "./case/CaseTool";
import { TimeTool } from "./time/TimeTool";
import { HashTool } from "./hash/HashTool";
import { UuidTool } from "./uuid/UuidTool";
import { DiffTool } from "./diff/DiffTool";
import { JwtTool } from "./jwt/JwtTool";
import { UrlParseTool } from "./urlparse/UrlParseTool";

/**
 * The MVP tool set. Components are wired in Phase 3; until then each entry
 * renders a scaffolded placeholder pane. Order within a category is preserved.
 */
export const TOOLS: ToolDefinition[] = [
  {
    id: "json-format",
    name: "JSON Format / Validate",
    category: "Formatters",
    description: "Pretty-print, minify, and validate JSON.",
    keywords: ["json", "format", "beautify", "minify", "validate", "pretty"],
    icon: Braces,
    component: JsonTool,
  },
  {
    id: "base64-string",
    name: "Base64 String",
    category: "Encoders",
    description: "Encode and decode Base64 text.",
    keywords: ["base64", "encode", "decode", "b64", "atob", "btoa"],
    icon: Binary,
    component: Base64Tool,
  },
  {
    id: "url-encode",
    name: "URL Encode / Decode",
    category: "Encoders",
    description: "Percent-encode and decode URL components.",
    keywords: ["url", "uri", "encode", "decode", "percent", "escape"],
    icon: Link,
    component: UrlTool,
  },
  {
    id: "html-entity",
    name: "HTML Entity Encode / Decode",
    category: "Encoders",
    description: "Escape and unescape HTML entities.",
    keywords: ["html", "entity", "escape", "unescape", "&amp;", "encode"],
    icon: Code,
    component: HtmlTool,
  },
  {
    id: "unix-time",
    name: "Unix Time Converter",
    category: "Converters",
    description: "Convert between Unix timestamps and human dates.",
    keywords: ["unix", "epoch", "timestamp", "time", "date", "iso"],
    icon: Clock,
    component: TimeTool,
  },
  {
    id: "number-base",
    name: "Number Base Converter",
    category: "Converters",
    description: "Convert numbers between binary, octal, decimal, and hex.",
    keywords: ["number", "base", "binary", "octal", "decimal", "hex", "radix"],
    icon: Calculator,
    component: NumberTool,
  },
  {
    id: "case-converter",
    name: "String Case Converter",
    category: "Converters",
    description: "Convert between camelCase, snake_case, kebab-case, and more.",
    keywords: ["case", "camel", "snake", "kebab", "pascal", "title", "upper"],
    icon: CaseSensitive,
    component: CaseTool,
  },
  {
    id: "hash-generator",
    name: "Hash Generator",
    category: "Generators",
    description: "Compute MD5, SHA-1, SHA-256, and SHA-512 digests.",
    keywords: ["hash", "md5", "sha", "sha1", "sha256", "sha512", "digest"],
    icon: Hash,
    component: HashTool,
  },
  {
    id: "uuid-generator",
    name: "UUID / ULID Generator",
    category: "Generators",
    description: "Generate and decode UUIDs and ULIDs.",
    keywords: ["uuid", "ulid", "guid", "id", "generate", "random"],
    icon: Fingerprint,
    component: UuidTool,
  },
  {
    id: "text-diff",
    name: "Text Diff Checker",
    category: "Text",
    description: "Compare two blocks of text line by line.",
    keywords: ["diff", "compare", "text", "changes", "delta"],
    icon: GitCompare,
    component: DiffTool,
  },
  {
    id: "jwt-debugger",
    name: "JWT Debugger",
    category: "Web",
    description: "Decode and inspect JSON Web Tokens.",
    keywords: ["jwt", "json web token", "decode", "auth", "bearer", "claims"],
    icon: KeyRound,
    component: JwtTool,
  },
  {
    id: "url-parser",
    name: "URL Parser",
    category: "Web",
    description: "Break a URL into its components and query parameters.",
    keywords: ["url", "parse", "query", "params", "host", "path", "scheme"],
    icon: Globe,
    component: UrlParseTool,
  },
];

export const DEFAULT_TOOL_ID = TOOLS[0].id;

const TOOLS_BY_ID = new Map(TOOLS.map((tool) => [tool.id, tool]));

export function getTool(id: string): ToolDefinition | undefined {
  return TOOLS_BY_ID.get(id);
}

const ACTION_NAMESPACE_TO_TOOL: Record<string, string> = {
  json: "json-format",
  base64: "base64-string",
  html: "html-entity",
  number: "number-base",
  case: "case-converter",
  time: "unix-time",
  hash: "hash-generator",
  id: "uuid-generator",
  diff: "text-diff",
  jwt: "jwt-debugger",
};

/** Map a dispatcher action id (e.g. from a deep link) to the owning tool. */
export function toolIdForAction(action: string): string | undefined {
  const [namespace, verb] = action.split(".");
  if (namespace === "url") return verb === "parse" ? "url-parser" : "url-encode";
  return ACTION_NAMESPACE_TO_TOOL[namespace];
}
