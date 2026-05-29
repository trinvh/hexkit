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
  Hexagon,
  Slash,
  ArrowDownAZ,
  ScanText,
  Dices,
  Pilcrow,
  Palette,
  CalendarClock,
  FileJson,
  Table,
  FileCode,
  Database,
  Image,
  Atom,
  Paintbrush,
  CodeXml,
  FileCode2,
  Code2,
  Regex,
  FileText,
  Eye,
  ShieldCheck,
  QrCode,
  FileImage,
  Terminal,
  Brackets,
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
import { HexTool } from "./hex/HexTool";
import { EscapeTool } from "./escape/EscapeTool";
import { LinesTool } from "./lines/LinesTool";
import { InspectorTool } from "./inspector/InspectorTool";
import { RandomTool } from "./random/RandomTool";
import { LoremTool } from "./lorem/LoremTool";
import { ColorTool } from "./color/ColorTool";
import { CronTool } from "./cron/CronTool";
import { YamlTool } from "./yaml/YamlTool";
import { CsvTool } from "./csv/CsvTool";
import { SqlTool } from "./sql/SqlTool";
import { PhpTool } from "./php/PhpTool";
import { SvgTool } from "./svg/SvgTool";
import { JsxTool } from "./jsx/JsxTool";
import { CssTool } from "./css/CssTool";
import { HtmlFmtTool } from "./htmlfmt/HtmlFmtTool";
import { XmlTool } from "./xml/XmlTool";
import { JsTool } from "./js/JsTool";
import { RegexpTool } from "./regexp/RegexpTool";
import { MarkdownTool } from "./markdown/MarkdownTool";
import { HtmlPreviewTool } from "./htmlpreview/HtmlPreviewTool";
import { X509Tool } from "./x509/X509Tool";
import { QrTool } from "./qr/QrTool";
import { Base64ImageTool } from "./base64image/Base64ImageTool";
import { CurlTool } from "./curlcode/CurlTool";
import { JsonCodeTool } from "./jsoncode/JsonCodeTool";

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
  {
    id: "hex-ascii",
    name: "Hex / ASCII",
    category: "Encoders",
    description: "Convert between hex and text.",
    keywords: ["hex", "ascii", "hexadecimal", "bytes", "encode", "decode"],
    icon: Hexagon,
    component: HexTool,
  },
  {
    id: "backslash-escape",
    name: "Backslash Escape / Unescape",
    category: "Encoders",
    description: "Escape and unescape string literals.",
    keywords: ["backslash", "escape", "unescape", "\\n", "string", "literal"],
    icon: Slash,
    component: EscapeTool,
  },
  {
    id: "line-tools",
    name: "Line Sort / Dedupe",
    category: "Text",
    description: "Sort, dedupe, and trim lines.",
    keywords: ["lines", "sort", "dedupe", "unique", "trim", "order"],
    icon: ArrowDownAZ,
    component: LinesTool,
  },
  {
    id: "string-inspector",
    name: "String Inspector",
    category: "Text",
    description: "Count characters, words, lines, and bytes.",
    keywords: ["string", "inspect", "count", "length", "words", "bytes"],
    icon: ScanText,
    component: InspectorTool,
  },
  {
    id: "random-string",
    name: "Random String",
    category: "Generators",
    description: "Generate random strings and passwords.",
    keywords: ["random", "string", "password", "token", "generate"],
    icon: Dices,
    component: RandomTool,
  },
  {
    id: "lorem-ipsum",
    name: "Lorem Ipsum",
    category: "Generators",
    description: "Generate placeholder text.",
    keywords: ["lorem", "ipsum", "placeholder", "text", "filler", "dummy"],
    icon: Pilcrow,
    component: LoremTool,
  },
  {
    id: "color-converter",
    name: "Color Converter",
    category: "Converters",
    description: "Convert between HEX, RGB, and HSL.",
    keywords: ["color", "hex", "rgb", "hsl", "convert", "palette"],
    icon: Palette,
    component: ColorTool,
  },
  {
    id: "cron-parser",
    name: "Cron Parser",
    category: "Converters",
    description: "Parse cron expressions and preview next runs.",
    keywords: ["cron", "schedule", "crontab", "job", "next", "runs"],
    icon: CalendarClock,
    component: CronTool,
  },
  {
    id: "yaml-json",
    name: "YAML ↔ JSON",
    category: "Converters",
    description: "Convert between YAML and JSON.",
    keywords: ["yaml", "json", "convert", "yml"],
    icon: FileJson,
    component: YamlTool,
  },
  {
    id: "csv-json",
    name: "CSV ↔ JSON",
    category: "Converters",
    description: "Convert between CSV and JSON.",
    keywords: ["csv", "json", "convert", "spreadsheet", "table"],
    icon: Table,
    component: CsvTool,
  },
  {
    id: "php-json",
    name: "PHP Serialize ↔ JSON",
    category: "Converters",
    description: "Serialize and unserialize PHP <-> JSON.",
    keywords: ["php", "serialize", "unserialize", "json"],
    icon: FileCode,
    component: PhpTool,
  },
  {
    id: "sql-formatter",
    name: "SQL Formatter",
    category: "Formatters",
    description: "Reformat SQL queries for readability.",
    keywords: ["sql", "format", "beautify", "query", "database"],
    icon: Database,
    component: SqlTool,
  },
  {
    id: "svg-css",
    name: "SVG to CSS",
    category: "Converters",
    description: "Wrap an SVG as a CSS background-image data URI.",
    keywords: ["svg", "css", "background", "data uri", "image"],
    icon: Image,
    component: SvgTool,
  },
  {
    id: "html-jsx",
    name: "HTML to JSX",
    category: "Web",
    description: "Convert HTML attributes to their JSX equivalents.",
    keywords: ["html", "jsx", "react", "className", "convert"],
    icon: Atom,
    component: JsxTool,
  },
  {
    id: "css-beautify",
    name: "CSS / SCSS / Less",
    category: "Formatters",
    description: "Beautify CSS, SCSS, and Less; minify CSS.",
    keywords: ["css", "scss", "less", "beautify", "minify", "format"],
    icon: Paintbrush,
    component: CssTool,
  },
  {
    id: "html-beautify",
    name: "HTML Beautify / Minify",
    category: "Formatters",
    description: "Pretty-print or minify HTML.",
    keywords: ["html", "beautify", "minify", "format", "pretty"],
    icon: CodeXml,
    component: HtmlFmtTool,
  },
  {
    id: "xml-beautify",
    name: "XML Beautify / Minify",
    category: "Formatters",
    description: "Re-indent or minify XML.",
    keywords: ["xml", "beautify", "minify", "format", "indent"],
    icon: FileCode2,
    component: XmlTool,
  },
  {
    id: "js-minify",
    name: "JS Minify",
    category: "Formatters",
    description: "Minify JavaScript.",
    keywords: ["javascript", "js", "minify", "uglify", "compress"],
    icon: Code2,
    component: JsTool,
  },
  {
    id: "regexp-tester",
    name: "RegExp Tester",
    category: "Text",
    description: "Test regular expressions and inspect matches.",
    keywords: ["regex", "regexp", "regular expression", "match", "pattern"],
    icon: Regex,
    component: RegexpTool,
  },
  {
    id: "markdown-preview",
    name: "Markdown Preview",
    category: "Text",
    description: "Render Markdown to HTML.",
    keywords: ["markdown", "md", "preview", "render", "commonmark"],
    icon: FileText,
    component: MarkdownTool,
  },
  {
    id: "html-preview",
    name: "HTML Preview",
    category: "Web",
    description: "Render an HTML snippet in a sandboxed frame.",
    keywords: ["html", "preview", "render", "iframe"],
    icon: Eye,
    component: HtmlPreviewTool,
  },
  {
    id: "x509-decoder",
    name: "Certificate Decoder",
    category: "Encoders",
    description: "Decode an X.509 (PEM) certificate.",
    keywords: ["x509", "certificate", "pem", "tls", "ssl", "decode"],
    icon: ShieldCheck,
    component: X509Tool,
  },
  {
    id: "qr-code",
    name: "QR Code",
    category: "Generators",
    description: "Generate and read QR codes.",
    keywords: ["qr", "qrcode", "barcode", "generate", "scan", "read"],
    icon: QrCode,
    component: QrTool,
  },
  {
    id: "base64-image",
    name: "Base64 Image",
    category: "Encoders",
    description: "Encode images to base64 and preview data URIs.",
    keywords: ["base64", "image", "data uri", "encode", "decode"],
    icon: FileImage,
    component: Base64ImageTool,
  },
  {
    id: "curl-to-code",
    name: "cURL to Code",
    category: "Converters",
    description: "Convert a curl command into request code.",
    keywords: ["curl", "code", "fetch", "requests", "http", "client"],
    icon: Terminal,
    component: CurlTool,
  },
  {
    id: "json-to-code",
    name: "JSON to Code",
    category: "Converters",
    description: "Generate type definitions from a JSON sample.",
    keywords: ["json", "code", "types", "interface", "struct", "model"],
    icon: Brackets,
    component: JsonCodeTool,
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

const KIND_TO_TOOL: Record<string, string> = {
  json: "json-format",
  base64: "base64-string",
  jwt: "jwt-debugger",
  unix_time: "unix-time",
  url: "url-parser",
  uuid: "uuid-generator",
};

/** Map a smart-detection kind to the tool that should open. */
export function toolIdForKind(kind: string): string | undefined {
  return KIND_TO_TOOL[kind];
}
