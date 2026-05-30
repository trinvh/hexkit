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
  CreditCard,
} from "lucide-react";
import { lazy } from "react";
import type { ToolDefinition } from "./types";

// Each tool is lazy-loaded so it lands in its own chunk; only the active tool's
// code (and its heavy deps like CodeMirror) is fetched on demand.
const JsonTool = lazy(() => import("./json/JsonTool").then((m) => ({ default: m.JsonTool })));
const Base64Tool = lazy(() => import("./base64/Base64Tool").then((m) => ({ default: m.Base64Tool })));
const UrlTool = lazy(() => import("./url/UrlTool").then((m) => ({ default: m.UrlTool })));
const HtmlTool = lazy(() => import("./html/HtmlTool").then((m) => ({ default: m.HtmlTool })));
const NumberTool = lazy(() => import("./number/NumberTool").then((m) => ({ default: m.NumberTool })));
const CaseTool = lazy(() => import("./case/CaseTool").then((m) => ({ default: m.CaseTool })));
const TimeTool = lazy(() => import("./time/TimeTool").then((m) => ({ default: m.TimeTool })));
const HashTool = lazy(() => import("./hash/HashTool").then((m) => ({ default: m.HashTool })));
const UuidTool = lazy(() => import("./uuid/UuidTool").then((m) => ({ default: m.UuidTool })));
const DiffTool = lazy(() => import("./diff/DiffTool").then((m) => ({ default: m.DiffTool })));
const JwtTool = lazy(() => import("./jwt/JwtTool").then((m) => ({ default: m.JwtTool })));
const UrlParseTool = lazy(() => import("./urlparse/UrlParseTool").then((m) => ({ default: m.UrlParseTool })));
const HexTool = lazy(() => import("./hex/HexTool").then((m) => ({ default: m.HexTool })));
const EscapeTool = lazy(() => import("./escape/EscapeTool").then((m) => ({ default: m.EscapeTool })));
const LinesTool = lazy(() => import("./lines/LinesTool").then((m) => ({ default: m.LinesTool })));
const InspectorTool = lazy(() => import("./inspector/InspectorTool").then((m) => ({ default: m.InspectorTool })));
const RandomTool = lazy(() => import("./random/RandomTool").then((m) => ({ default: m.RandomTool })));
const LoremTool = lazy(() => import("./lorem/LoremTool").then((m) => ({ default: m.LoremTool })));
const ColorTool = lazy(() => import("./color/ColorTool").then((m) => ({ default: m.ColorTool })));
const CronTool = lazy(() => import("./cron/CronTool").then((m) => ({ default: m.CronTool })));
const YamlTool = lazy(() => import("./yaml/YamlTool").then((m) => ({ default: m.YamlTool })));
const CsvTool = lazy(() => import("./csv/CsvTool").then((m) => ({ default: m.CsvTool })));
const SqlTool = lazy(() => import("./sql/SqlTool").then((m) => ({ default: m.SqlTool })));
const PhpTool = lazy(() => import("./php/PhpTool").then((m) => ({ default: m.PhpTool })));
const SvgTool = lazy(() => import("./svg/SvgTool").then((m) => ({ default: m.SvgTool })));
const JsxTool = lazy(() => import("./jsx/JsxTool").then((m) => ({ default: m.JsxTool })));
const CssTool = lazy(() => import("./css/CssTool").then((m) => ({ default: m.CssTool })));
const HtmlFmtTool = lazy(() => import("./htmlfmt/HtmlFmtTool").then((m) => ({ default: m.HtmlFmtTool })));
const XmlTool = lazy(() => import("./xml/XmlTool").then((m) => ({ default: m.XmlTool })));
const JsTool = lazy(() => import("./js/JsTool").then((m) => ({ default: m.JsTool })));
const RegexpTool = lazy(() => import("./regexp/RegexpTool").then((m) => ({ default: m.RegexpTool })));
const MarkdownTool = lazy(() => import("./markdown/MarkdownTool").then((m) => ({ default: m.MarkdownTool })));
const HtmlPreviewTool = lazy(() => import("./htmlpreview/HtmlPreviewTool").then((m) => ({ default: m.HtmlPreviewTool })));
const X509Tool = lazy(() => import("./x509/X509Tool").then((m) => ({ default: m.X509Tool })));
const QrTool = lazy(() => import("./qr/QrTool").then((m) => ({ default: m.QrTool })));
const Base64ImageTool = lazy(() => import("./base64image/Base64ImageTool").then((m) => ({ default: m.Base64ImageTool })));
const CurlTool = lazy(() => import("./curlcode/CurlTool").then((m) => ({ default: m.CurlTool })));
const JsonCodeTool = lazy(() => import("./jsoncode/JsonCodeTool").then((m) => ({ default: m.JsonCodeTool })));
const LuhnTool = lazy(() => import("./luhn/LuhnTool").then((m) => ({ default: m.LuhnTool })));
const CreditCardTool = lazy(() => import("./creditcard/CreditCardTool").then((m) => ({ default: m.CreditCardTool })));
const TlvTool = lazy(() => import("./tlv/TlvTool").then((m) => ({ default: m.TlvTool })));

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
    description: "Convert numbers between any bases from 2 to 36.",
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
    description: "Convert between HEX, RGB(A), HSL(A), HSB, HWB, and CMYK.",
    keywords: [
      "color",
      "hex",
      "rgb",
      "rgba",
      "hsl",
      "hsla",
      "hsb",
      "hsv",
      "hwb",
      "cmyk",
      "convert",
      "palette",
      "picker",
    ],
    icon: Palette,
    component: ColorTool,
  },
  {
    id: "cron-parser",
    name: "Cron Parser",
    category: "Converters",
    description: "Describe a cron expression, break down fields, preview next runs.",
    keywords: ["cron", "schedule", "crontab", "job", "next", "runs", "describe"],
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
  {
    id: "luhn-checker",
    name: "Luhn Checker",
    category: "Encoders",
    description: "Validate and complete Luhn (mod 10) check digits.",
    keywords: ["luhn", "mod10", "checksum", "credit card", "iban", "imei", "validate"],
    icon: ShieldCheck,
    component: LuhnTool,
  },
  {
    id: "credit-card-generator",
    name: "Credit Card Generator",
    category: "Generators",
    description: "Generate Luhn-valid TEST credit card numbers (not real cards).",
    keywords: ["credit card", "test", "luhn", "visa", "mastercard", "amex", "fake"],
    icon: CreditCard,
    component: CreditCardTool,
  },
  {
    id: "tlv-decoder",
    name: "TLV Decoder",
    category: "Encoders",
    description: "Decode BER-TLV / EMV chip data into a tagged tree.",
    keywords: ["tlv", "ber", "emv", "smart card", "chip", "tag length value"],
    icon: Brackets,
    component: TlvTool,
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
  luhn: "luhn-checker",
  card: "credit-card-generator",
  tlv: "tlv-decoder",
  hex: "hex-ascii",
  escape: "backslash-escape",
  lines: "line-tools",
  string: "string-inspector",
  random: "random-string",
  lorem: "lorem-ipsum",
  color: "color-converter",
  cron: "cron-parser",
  yaml: "yaml-json",
  csv: "csv-json",
  php: "php-json",
  sql: "sql-formatter",
  svg: "svg-css",
  jsx: "html-jsx",
  css: "css-beautify",
  xml: "xml-beautify",
  js: "js-minify",
  htmlfmt: "html-beautify",
  regexp: "regexp-tester",
  markdown: "markdown-preview",
  x509: "x509-decoder",
  qr: "qr-code",
  curl: "curl-to-code",
  jsoncode: "json-to-code",
};

/** Map a dispatcher action id (e.g. from a deep link) to the owning tool. */
export function toolIdForAction(action: string): string | undefined {
  const [namespace, verb] = action.split(".");
  if (namespace === "url") return verb === "parse" ? "url-parser" : "url-encode";
  return ACTION_NAMESPACE_TO_TOOL[namespace];
}

const KIND_TO_TOOL: Record<string, string> = {
  json: "json-format",
  xml: "xml-beautify",
  sql: "sql-formatter",
  css: "css-beautify",
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
