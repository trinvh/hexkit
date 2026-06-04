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
  Key,
  Lock,
  Unlock,
  PenTool,
  BadgeCheck,
  ShieldPlus,
  Send,
  Archive,
  Network,
  Container,
  Smartphone,
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
const HttpClientTool = lazy(() => import("./http-client/HttpClientTool").then((m) => ({ default: m.HttpClientTool })));
const JsonCodeTool = lazy(() => import("./jsoncode/JsonCodeTool").then((m) => ({ default: m.JsonCodeTool })));
const LuhnTool = lazy(() => import("./luhn/LuhnTool").then((m) => ({ default: m.LuhnTool })));
const CreditCardTool = lazy(() => import("./creditcard/CreditCardTool").then((m) => ({ default: m.CreditCardTool })));
const TlvTool = lazy(() => import("./tlv/TlvTool").then((m) => ({ default: m.TlvTool })));
const PgpKeygenTool = lazy(() => import("./pgp-keygen/PgpKeygenTool").then((m) => ({ default: m.PgpKeygenTool })));
const PgpEncryptTool = lazy(() => import("./pgp-encrypt/PgpEncryptTool").then((m) => ({ default: m.PgpEncryptTool })));
const PgpDecryptTool = lazy(() => import("./pgp-decrypt/PgpDecryptTool").then((m) => ({ default: m.PgpDecryptTool })));
const PgpSignTool = lazy(() => import("./pgp-sign/PgpSignTool").then((m) => ({ default: m.PgpSignTool })));
const PgpVerifyTool = lazy(() => import("./pgp-verify/PgpVerifyTool").then((m) => ({ default: m.PgpVerifyTool })));
const PgpEncryptSignTool = lazy(() => import("./pgp-encrypt-sign/PgpEncryptSignTool").then((m) => ({ default: m.PgpEncryptSignTool })));
const PgpDecryptVerifyTool = lazy(() => import("./pgp-decrypt-verify/PgpDecryptVerifyTool").then((m) => ({ default: m.PgpDecryptVerifyTool })));
const Base32Tool = lazy(() => import("./base32/Base32Tool").then((m) => ({ default: m.Base32Tool })));
const Base58Tool = lazy(() => import("./base58/Base58Tool").then((m) => ({ default: m.Base58Tool })));
const ChmodTool = lazy(() => import("./chmod/ChmodTool").then((m) => ({ default: m.ChmodTool })));
const TomlTool = lazy(() => import("./toml/TomlTool").then((m) => ({ default: m.TomlTool })));
const HtmlMarkdownTool = lazy(() => import("./html-markdown/HtmlMarkdownTool").then((m) => ({ default: m.HtmlMarkdownTool })));
const GzipTool = lazy(() => import("./gzip/GzipTool").then((m) => ({ default: m.GzipTool })));
const JwtSignerTool = lazy(() => import("./jwt-signer/JwtSignerTool").then((m) => ({ default: m.JwtSignerTool })));
const PasswordHashTool = lazy(() => import("./password-hash/PasswordHashTool").then((m) => ({ default: m.PasswordHashTool })));
const AesTool = lazy(() => import("./aes/AesTool").then((m) => ({ default: m.AesTool })));
const TotpTool = lazy(() => import("./totp/TotpTool").then((m) => ({ default: m.TotpTool })));
const CidrTool = lazy(() => import("./cidr/CidrTool").then((m) => ({ default: m.CidrTool })));
const DockerComposeTool = lazy(() => import("./docker-compose/DockerComposeTool").then((m) => ({ default: m.DockerComposeTool })));

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
    id: "http-client",
    name: "HTTP Client",
    category: "Web",
    description: "Import a curl command, edit the request, send it, inspect the response.",
    keywords: [
      "http",
      "client",
      "request",
      "rest",
      "api",
      "curl",
      "postman",
      "fetch",
      "send",
      "response",
    ],
    icon: Send,
    component: HttpClientTool,
    networked: true,
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
  {
    id: "pgp-keygen",
    name: "Generate PGP Key Pair",
    category: "Cryptography",
    description: "Generate an Ed25519 + Curve25519 OpenPGP key pair (ASCII-armored).",
    keywords: ["pgp", "gpg", "openpgp", "key", "keygen", "generate", "ed25519", "curve25519"],
    icon: Key,
    component: PgpKeygenTool,
  },
  {
    id: "pgp-encrypt",
    name: "PGP Encrypt",
    category: "Cryptography",
    description: "Encrypt a message to a recipient's OpenPGP public key.",
    keywords: ["pgp", "gpg", "openpgp", "encrypt", "cipher"],
    icon: Lock,
    component: PgpEncryptTool,
  },
  {
    id: "pgp-decrypt",
    name: "PGP Decrypt",
    category: "Cryptography",
    description: "Decrypt an OpenPGP message with your private key.",
    keywords: ["pgp", "gpg", "openpgp", "decrypt", "cipher"],
    icon: Unlock,
    component: PgpDecryptTool,
  },
  {
    id: "pgp-sign",
    name: "PGP Sign",
    category: "Cryptography",
    description: "Produce a detached OpenPGP signature over a message.",
    keywords: ["pgp", "gpg", "openpgp", "sign", "signature", "detached"],
    icon: PenTool,
    component: PgpSignTool,
  },
  {
    id: "pgp-verify",
    name: "PGP Verify",
    category: "Cryptography",
    description: "Verify a detached OpenPGP signature against a public key.",
    keywords: ["pgp", "gpg", "openpgp", "verify", "signature", "detached"],
    icon: BadgeCheck,
    component: PgpVerifyTool,
  },
  {
    id: "pgp-encrypt-sign",
    name: "PGP Encrypt and Sign",
    category: "Cryptography",
    description: "Encrypt to a recipient and sign in one inline-signed message.",
    keywords: ["pgp", "gpg", "openpgp", "encrypt", "sign", "inline", "signed"],
    icon: ShieldPlus,
    component: PgpEncryptSignTool,
  },
  {
    id: "pgp-decrypt-verify",
    name: "PGP Decrypt and Verify",
    category: "Cryptography",
    description: "Decrypt an inline-signed PGP message and verify the embedded signature.",
    keywords: ["pgp", "gpg", "openpgp", "decrypt", "verify", "inline", "signed"],
    icon: ShieldCheck,
    component: PgpDecryptVerifyTool,
  },
  {
    id: "base32",
    name: "Base32",
    category: "Encoders",
    description: "Encode and decode Base32 (RFC 4648).",
    keywords: ["base32", "encode", "decode", "rfc4648", "b32"],
    icon: Binary,
    component: Base32Tool,
  },
  {
    id: "base58",
    name: "Base58",
    category: "Encoders",
    description: "Encode and decode Base58 (Bitcoin alphabet).",
    keywords: ["base58", "encode", "decode", "bitcoin", "btc", "b58"],
    icon: Binary,
    component: Base58Tool,
  },
  {
    id: "gzip",
    name: "Gzip Compress / Decompress",
    category: "Encoders",
    description: "Gzip-compress text to Base64 and back.",
    keywords: ["gzip", "compress", "decompress", "gunzip", "deflate", "zip", "base64"],
    icon: Archive,
    component: GzipTool,
  },
  {
    id: "chmod-calculator",
    name: "chmod Calculator",
    category: "Converters",
    description: "Convert Unix permissions between octal and symbolic.",
    keywords: ["chmod", "permissions", "octal", "symbolic", "unix", "rwx", "file mode"],
    icon: Lock,
    component: ChmodTool,
  },
  {
    id: "toml-convert",
    name: "TOML ↔ JSON / YAML",
    category: "Converters",
    description: "Convert between TOML, JSON, and YAML.",
    keywords: ["toml", "json", "yaml", "convert", "config"],
    icon: FileCode,
    component: TomlTool,
  },
  {
    id: "html-markdown",
    name: "HTML → Markdown",
    category: "Converters",
    description: "Convert HTML into Markdown.",
    keywords: ["html", "markdown", "md", "convert", "to markdown"],
    icon: FileText,
    component: HtmlMarkdownTool,
  },
  {
    id: "docker-compose",
    name: "docker run → Compose",
    category: "Converters",
    description: "Convert a docker run command into docker-compose YAML.",
    keywords: ["docker", "compose", "docker-compose", "run", "container", "yaml"],
    icon: Container,
    component: DockerComposeTool,
  },
  {
    id: "password-hash",
    name: "Password Hash",
    category: "Cryptography",
    description: "Hash and verify passwords with bcrypt or Argon2.",
    keywords: ["password", "hash", "bcrypt", "argon2", "verify", "phc"],
    icon: KeyRound,
    component: PasswordHashTool,
  },
  {
    id: "aes-encrypt",
    name: "AES Encrypt / Decrypt",
    category: "Cryptography",
    description: "Password-based AES-256-GCM symmetric encryption.",
    keywords: ["aes", "encrypt", "decrypt", "gcm", "symmetric", "cipher", "password"],
    icon: Lock,
    component: AesTool,
  },
  {
    id: "totp",
    name: "TOTP / 2FA",
    category: "Cryptography",
    description: "Generate time-based one-time passwords and otpauth QR codes.",
    keywords: ["totp", "2fa", "otp", "authenticator", "mfa", "one time password", "rfc6238"],
    icon: Smartphone,
    component: TotpTool,
  },
  {
    id: "jwt-signer",
    name: "JWT Signer",
    category: "Web",
    description: "Sign a JSON Web Token (HS256/384/512).",
    keywords: ["jwt", "sign", "signer", "encode", "json web token", "hmac", "bearer"],
    icon: Key,
    component: JwtSignerTool,
  },
  {
    id: "cidr-calculator",
    name: "CIDR / Subnet Calculator",
    category: "Web",
    description: "Parse an IPv4/IPv6 CIDR block into subnet details.",
    keywords: ["cidr", "subnet", "ip", "ipv4", "ipv6", "netmask", "network", "calculator"],
    icon: Network,
    component: CidrTool,
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
  httpreq: "http-client",
  jsoncode: "json-to-code",
  base32: "base32",
  base58: "base58",
  gzip: "gzip",
  chmod: "chmod-calculator",
  toml: "toml-convert",
  htmlmd: "html-markdown",
  dockerc: "docker-compose",
  pwhash: "password-hash",
  aes: "aes-encrypt",
  totp: "totp",
  cidr: "cidr-calculator",
};

/** Map a dispatcher action id (e.g. from a deep link) to the owning tool. */
export function toolIdForAction(action: string): string | undefined {
  const [namespace, verb] = action.split(".");
  if (namespace === "url") return verb === "parse" ? "url-parser" : "url-encode";
  // `jwt` decodes/verifies in the debugger but signs in the signer.
  if (namespace === "jwt") return verb === "sign" ? "jwt-signer" : "jwt-debugger";
  // `pgp` has seven distinct verbs, each its own tool — verb-specific routing.
  if (namespace === "pgp") {
    switch (verb) {
      case "keygen":
        return "pgp-keygen";
      case "encrypt":
        return "pgp-encrypt";
      case "decrypt":
        return "pgp-decrypt";
      case "sign":
        return "pgp-sign";
      case "verify":
        return "pgp-verify";
      case "encrypt_sign":
        return "pgp-encrypt-sign";
      case "decrypt_verify":
        return "pgp-decrypt-verify";
      default:
        return undefined;
    }
  }
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
