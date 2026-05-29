# Hexkit

A fast, **offline** developer toolbox for macOS, Windows, and Linux — ~40 everyday
encoding, formatting, conversion, and inspection tools in one keyboard-driven app.
Everything runs locally; nothing you paste ever leaves your machine.

Built with **Tauri** (Rust core + system WebView) and **React 19**. All tool logic
lives in a pure Rust crate, so the same engine powers the desktop app, a headless
CLI, and `hexkit://` deep links.

> **License:** PolyForm Noncommercial 1.0.0 — free for personal and other
> non-commercial use. Commercial use requires a paid license. See
> [License & commercial use](#license--commercial-use).

---

## Highlights

- **100% offline** — all processing happens in local Rust; no network calls.
- **Command palette** (⌘K) and a filterable sidebar to reach any tool instantly.
- **Smart Detection** — detects the right tool from your clipboard contents.
- **Syntax highlighting** on inputs and outputs (CodeMirror 6).
- **Pinned & recently-used** tools above the sidebar filter.
- **Light & dark** themes, both designed intentionally.
- **Multi-tab workspace** — open tools (even the same tool) in separate tabs,
  with per-tab state that persists across restarts.\*
- Headless **CLI** (`hexkit`) and **deep-link** dispatch for future integrations.

\* Some advanced capabilities are planned to require a paid license — see below.

## Tools

**Formatters** — JSON format/validate (with JSONPath filter & sort keys), SQL,
CSS/SCSS/Less, HTML, XML (with XPath filter), JS minify.

**Encoders** — Base64 string, URL encode/decode, HTML entities, Hex/ASCII,
backslash escape, X.509 certificate decoder, Base64 image.

**Converters** — Unix time, number base (2–36), string case, color
(HEX/RGB(A)/HSL(A)/HSB/HWB/CMYK), cron parser, YAML↔JSON, CSV↔JSON, PHP↔JSON,
SVG→CSS, HTML→JSX, cURL→code, JSON→code.

**Generators** — hashes (MD5/SHA-1/256/512 + HMAC), UUID/ULID/Nano ID, random
string, Lorem Ipsum, QR code.

**Text** — diff checker (text/JSON/XML), line sort/dedupe, string inspector,
RegExp tester (with substitution).

**Web** — JWT debugger (decode + HS256/384/512 verify), URL parser, HTML preview,
Markdown preview.

## Getting started

### Prerequisites

- [Node.js](https://nodejs.org) 20+ and [pnpm](https://pnpm.io)
- [Rust](https://rustup.rs) (stable)
- Tauri OS prerequisites — see the
  [Tauri setup guide](https://v2.tauri.app/start/prerequisites/)

### Run the desktop app

```bash
pnpm install
make dev          # or: pnpm tauri dev
```

### Common tasks (see the `Makefile`)

```bash
make web          # frontend only, in a browser
make build        # production frontend bundle
make bundle       # build the distributable desktop app
make cli          # build the headless `hexkit` CLI
make test         # Rust + frontend test suites
make check        # typecheck + lint (clippy) + tests + build
```

## Architecture

```
crates/devtools-core/   Pure, Tauri-independent tool logic (one module per tool)
crates/hexkit-cli/      Headless `hexkit` binary over the same dispatcher
src-tauri/              Tauri shell (run_action command, clipboard, deep link)
src/                    React UI (tool registry, shared primitives, per-tool views)
```

Every tool exposes a uniform `run(action, params) -> Result<Value, ToolError>`
function. The desktop app, the CLI, and `hexkit://` deep links all route through
the same dispatcher, so behavior is identical everywhere.

## Tech stack

Tauri 2 · Rust · React 19 · TypeScript · Vite · Tailwind CSS v4 · Zustand ·
CodeMirror 6 · Vitest.

## License & commercial use

Hexkit is **source-available**, not OSI "open source": it is licensed under the
[PolyForm Noncommercial License 1.0.0](./LICENSE).

- ✅ **Free** for any non-commercial purpose — personal use, hobby projects,
  study, research, education, and non-profit/charitable organizations.
- 💼 **A paid commercial license is required** for any commercial use.
- 🔒 Certain advanced capabilities (a planned **Raycast extension** and some
  power-user features such as multi-tab workflows) are intended to require a
  paid license in the future.

For commercial licensing, please open an issue to get in touch.

Third-party dependencies retain their own licenses (mostly MIT/Apache-2.0).

## Contributing

Contributions are welcome — see [CONTRIBUTING.md](./CONTRIBUTING.md). By
contributing you agree your contributions are licensed under the project license.

## Acknowledgements

Inspired by [DevUtils](https://devutils.com). Built on the work of the Tauri,
React, CodeMirror, and broader Rust and TypeScript communities.
