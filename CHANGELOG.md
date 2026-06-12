# Changelog

All notable changes to **Hexkit** are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Each release is also published at <https://github.com/trinvh/hexkit/releases>
with platform installers and a standalone `hexkit` CLI archive attached.

## [0.3.4] - 2026-06-12

### Changed

- The output **Download** action now opens the native **Save As…** dialog in
  the desktop app, so you choose both the filename and where the file is saved
  (writing through a trusted `save_file` backend command). The browser/web
  preview keeps the plain download-to-default-folder fallback.

## [0.3.3] - 2026-06-12

### Added

- **Output action menu.** Every transform tool's **Copy output** control now
  sits beside a three-dot menu (shared `OutputActions` component) that can hand
  the current output straight to another tool in a new tab — **Convert to
  Base64** or **Convert to Hex** (both opening pre-filled in encode mode) — or
  **Download** it to a file.
- **Hex / ASCII** output formatting: choose **uppercase** (default) or
  lowercase digits, and set an optional **delimiter** inserted between bytes.
- **BER-TLV decoder** input encoding toggle: parse the stream as **hex**
  (default) or **Base64**.

### Changed

- `hex.decode` now tolerates common byte separators (`:`, `-`, `,`, `_`, `.`
  and whitespace), so delimited hex round-trips cleanly.

## [0.3.2] - 2026-06-04

### Added

- **Twelve new tools**, built as one batch:
  - **Encoders** — **Base32** (RFC 4648), **Base58** (Bitcoin alphabet), and
    **Gzip** compress/decompress (text ↔ Base64).
  - **Converters** — **chmod calculator** (octal ↔ symbolic), **TOML ↔ JSON /
    YAML**, **HTML → Markdown**, and **docker run → docker-compose** (common-flags
    subset).
  - **Cryptography** — **password hashing + verify** (bcrypt / Argon2),
    **AES-256-GCM** password-based encrypt/decrypt (PBKDF2-HMAC-SHA256), and a
    **TOTP / 2FA authenticator** (RFC 4226/6238) with a live code, countdown and
    `otpauth://` QR.
  - **Web** — a **JWT signer** (HS256/384/512) completing the JWT tool, and a
    **CIDR / subnet calculator** (IPv4 + IPv6).
  - All are reachable from the desktop app, the `hexkit` CLI, and `hexkit://`
    deep links; the pure transforms are also exposed where applicable.

## [0.3.1] - 2026-06-03

### Added

- **"Automatically check for updates" setting** (`View → Settings…`), on by
  default. Turn it off to skip the silent launch-time GitHub release check and
  keep startup fully offline — the menu's "Check for Updates…" still works on
  demand. The choice persists across restarts.

## [0.3.0] - 2026-06-03

### Added

- **HTTP Client tool** (Web category) — a Postman-style request builder. Import
  a `curl` command, edit the method / URL / query params / headers / body (raw
  with JSON formatting, `x-www-form-urlencoded`, or `multipart/form-data`), send
  the request, and inspect the response (status, elapsed time, size, headers,
  and a pretty/highlighted body). Export the edited request back to `curl` or to
  request code (JS / Python / Go / PHP / Rust). Request modelling is pure and
  offline in `devtools-core::httpreq` (`httpreq.from_curl` / `httpreq.to_curl`,
  reachable from the CLI and MCP); the **actual network send is a dedicated
  `http_send` Tauri command** that runs off the UI thread and is *not* routed
  through the offline dispatcher. It is the one tool that reaches the network —
  marked with an **Online** badge — and sending is desktop-only (import/export
  work everywhere).
- **File drag-and-drop and clipboard paste.** A shared `FileDrop` component lets
  the **Base64 Image** and **QR Code** tools accept a file three ways — click to
  browse, drag-and-drop, or **paste from the clipboard** (e.g. a screenshot via
  ⌘/Ctrl+V, no need to save it to disk first). It shows an image preview with a
  **Clear** button, a spinner while the file is processed, and a clear error
  when a dropped/pasted file isn't an image. Plain-text paste is left untouched
  so it still reaches focused inputs.

### Fixed

- **Large inputs no longer freeze the UI.** Pasting a multi-MB value used to
  hang: every debounced per-tab state commit re-serialized the whole persisted
  store to `localStorage`, and CodeMirror highlighted/wrapped the huge document
  synchronously. Values over ~100 KB are now kept in memory (not persisted), and
  syntax highlighting / line-wrapping is skipped for very large documents.

### Internal

- `src-tauri` adds the `base64` dependency (encodes binary HTTP response bodies)
  and sets the window's `dragDropEnabled: false` so the webview handles HTML5
  drag-and-drop instead of Tauri intercepting OS drops natively.
- Exploratory design note `docs/plugin-system-evaluation.md` evaluating a
  WASM-based plugin/marketplace architecture (no implementation yet).

## [0.2.0] - 2026-06-01

### Added

- **Built-in MCP server** (`crates/hexkit-mcp`) — exposes a curated subset of
  Hexkit's deterministic tools to LLM agents over the Model Context Protocol,
  routed through the same `devtools-core` dispatcher as the app and CLI. The
  set is intentionally small — PGP keygen / encrypt / decrypt / sign / verify,
  hash, HMAC, JWT decode / verify, X.509 decode, BER-TLV decode, cron parse and
  ID generate — so it stays cheap on a client's context window. Trivial
  transforms (JSON formatting, Base64, …) are omitted on purpose. Ships as a
  standalone stdio binary (`hexkit-mcp`) for clients like Claude Desktop.
- **In-app MCP server toggle** — `View → Settings…` hosts the same tools over a
  loopback Streamable-HTTP endpoint (default `127.0.0.1:7676`, **off by
  default**) for clients that take a local URL (Claude Code, Cursor, Cline).
  The Settings panel shows live status and a tabbed copy-paste client config
  (HTTP URL / stdio binary).
- **View menu** with **Show Sidebar** (Cmd/Ctrl+B) and **Show Header Bar**
  (Cmd/Ctrl+Shift+B) toggles to maximize the content area; the choices persist
  across restarts.

### Changed

- **Native menu bar on every platform.** The application menu (the CLI / app /
  View items) now builds on Windows and Linux too — previously macOS-only.
- **Release flow documents itself.** `make release` and the `hexkit-release`
  skill now require updating `CHANGELOG.md` and stage it into the release
  commit; `scripts/bump.mjs` tolerates a dirty `CHANGELOG.md`.

### Fixed

- **"Check for updates" no longer dies on `GitHub returned 403`.** The check
  now runs in Rust with a proper `User-Agent`, and when GitHub's API rate limit
  is exhausted it reports when to retry — "rate limit is exhausted. Try again in
  ~N min (around H:MM)" — derived from the `x-ratelimit-reset` header, instead
  of a bare 403.

### Internal

- New workspace dependencies: `rmcp` (official Rust MCP SDK), `axum`, `tokio`,
  `tokio-util`, `ureq`. The stdio binary stays axum-free; the Streamable-HTTP
  transport lives behind an `http` cargo feature enabled only by the desktop
  app.
- The `hexkit-release` skill now pushes the branch and tag automatically after
  tagging.

## [0.1.3] - 2026-06-01

### Added

- **Cryptography sidebar category** with seven OpenPGP tools:
  - `Generate PGP Key Pair` — Ed25519 (sign + certify) + Curve25519
    (encrypt), ASCII-armored, optional passphrase.
  - `PGP Encrypt` — to a recipient public key, SEIPDv1 / AES-256.
  - `PGP Decrypt` — with your private key.
  - `PGP Sign` — detached, text-normalized signature.
  - `PGP Verify` — detached signature against a public key.
  - `PGP Encrypt and Sign` — inline-signed encrypted message in one pass.
  - `PGP Decrypt and Verify` — decrypt + verify the embedded signature.
- Backend built on **rpgp** (the pure-Rust `pgp` crate, 0.19) — no C
  dependencies, fully offline, GnuPG-interoperable.
- Pre-generated Alice / Bob sample key pair behind every "Sample"
  button, so the tools demonstrate real encryption / verification out
  of the box.
- Per-action verb routing in `toolIdForAction` so every
  `hexkit://pgp.*` deep link lands on the right tool.
- Seven new Raycast commands (`pgp-keygen`, `pgp-encrypt`, …) covering
  the full PGP set.
- New landing-page screenshots (49 of 55 tools covered).
- `hexkit-screenshots` skill: drives `scripts/capture-screenshots.sh`
  end-to-end, with support for multi-field tools via JSON seed files
  under `scripts/screenshot-seeds/`.

### Changed

- **GitHub release workflow auto-publishes.** A new `publish` job runs
  after the 4-platform matrix and flips the draft to `--latest`
  automatically — no manual click required.
- Raycast extension restructured to one command per Hexkit tool (was
  a single Search-Tools entry). Each command file is ~15 lines on top
  of shared `TextTransform` / `MultiTransform` / `DeepLinkOnly` helpers.
- CLAUDE.md gains a Releases section documenting the end-to-end flow
  and the sibling-repo commit convention.

### Internal

- Workspace adds `rand = "0.8"` aliased as `rand_v08` because rpgp 0.19
  consumes rand 0.8; the workspace continues to use rand 0.10 for other
  tools. The two coexist without conflict.
- 12 new Rust unit tests covering encrypt/decrypt + sign/verify
  roundtrips, wrong-key rejection, passphrase support, and combined
  operations.

## [0.1.2] - 2026-05-30

### Added

- **X.509 decoder Sample button** — pre-loads a hexkit.app self-signed
  certificate (RSA-2048, sha256WithRSAEncryption, 825-day validity)
  with multiple SANs so the inspector has something to chew on out of
  the box.

### Changed

- **Single release workflow.** `ci.yml` is merged into `release.yml`
  as a `gate` job that runs first on every push / PR / tag. The
  matrix build only runs after the gate is green and only on tag
  pushes or manual dispatch. Removes the duplicate gate run that
  used to fire from both workflows on a tag push.

## [0.1.1] - 2026-05-30

### Added

- **New tools (Wave 6):**
  - XML / SQL / CSS smart-detect — pasting any of these into a
    detection-aware tool routes to the right beautifier.
  - Luhn checker (validates Luhn-checked numbers — credit cards,
    IMEI, IDs — and proposes the corrected check digit).
  - Test credit card generator (Luhn-valid Visa / Mastercard / Amex /
    Discover / JCB / Diners / UnionPay).
  - BER-TLV / EMV chip-data decoder with the tag tree rendered as
    collapsible nodes.
- **In-app `hexkit` CLI installer** — first-run prompt, menu-bar
  "Install / Update / Uninstall Command Line Tools…" entries, with
  CLI-vs-app version checks and a "Check for updates" item that talks
  to the GitHub Releases API.
- **`hexkit://` deep-link forwarding for every param** — not just
  `input`. Tools that use `useToolState(<field>)` pick up every URL
  query parameter, enabling multi-field deep links from Raycast, the
  CLI, or your browser.
- **`make dev-bundle`** target that builds a debug `.app`, registers
  it with Launch Services, and `open`s it once so `hexkit://` links
  reliably route during `make dev` iteration.
- **CI: 4-platform release workflow** for macOS arm64, macOS x64,
  Linux, and Windows. Builds the desktop installer + a standalone
  `hexkit` CLI archive (tarball on macOS/Linux, zip on Windows) with
  a SHA-256 checksum side-car. Attaches everything to a draft GitHub
  release.
- README ships a CLI cheatsheet covering every namespace; project
  CLAUDE.md documents architecture, conventions, the gate, and the
  cross-repo propagation rule.

### Changed

- Renamed every workspace member, identifier, bundle, and binary to
  `hexkit` (drops references to the external project this was forked
  from). `com.hexkit.app` is the canonical bundle identifier.
- Source-available publishing setup: **PolyForm Noncommercial 1.0.0**
  license, contributor expectations, README guard rail to never call
  the project OSI "open source".
- Color converter expanded to HEX (incl. alpha), RGB(A), HSL(A), HSB,
  HWB, and CMYK with a built-in picker.
- Number base converter is now bidirectional (edit any base, the
  others recompute) and supports custom radices 2–36.
- Cron parser renders English description, per-field breakdown, and
  the next N runs.
- JWT debugger output is JSON-syntax-highlighted.
- XML tool gains an XPath filter for sub-tree extraction.

### Fixed

- Portable SHA-256 in the CI archive step — Windows runners don't ship
  `shasum`, fall back to `sha256sum` when available.
- CLI sidecar is built before `make check` runs, so a clean clone can
  go straight from `cargo` to a green gate.

## [0.1.0] - 2026-05-29

Initial release. Hexkit ships as a fast, **offline** cross-platform
developer toolbox built on Tauri 2 + Rust + React 19. All tool logic
lives in `crates/devtools-core` and is reachable identically from the
desktop app, the headless `hexkit` CLI, and `hexkit://` deep links.

### Added

- **JSON & data** — JSON formatter / minify / JSONPath query,
  YAML ↔ JSON, CSV ↔ JSON, SQL formatter, XML formatter,
  HTML → JSX, PHP array ↔ JSON, SVG → CSS, JSON → code (type
  definitions in TypeScript / Rust / Go / …).
- **Encode & decode** — Base64 (string + image), URL encode / decode
  + URL parser, Hex encode / decode, HTML entities, JWT debugger
  (decode + HS256/384/512 verify), backslash escape, X.509 certificate
  decoder.
- **Convert** — Number base (2–36), Unix time, cron parser, string
  case converter, color converter (HEX / RGB / HSL / HSB / HWB / CMYK
  with picker), cURL → code.
- **Generate** — Hash (MD5 / SHA-1 / SHA-256 / SHA-384 / SHA-512 +
  HMAC), UUID v4 / v7 / ULID / Nano ID, random string, Lorem ipsum,
  QR code.
- **Inspect & preview** — RegExp tester (with substitution), Markdown
  preview, HTML preview, X.509 inspector, QR reader, string inspector,
  ID inspector.
- **Text** — Text diff (line / JSON / XML), line sort / dedupe / trim,
  CSS / SCSS / Less beautify + minify, HTML beautify + minify, XML
  beautify + minify, JS minify.
- **Smart clipboard detection** — pasting into the command palette
  routes to the right tool based on content (JSON, XML, SQL, JWT,
  Base64, Unix time, URL, UUID, …).
- **Multi-tab shell** — open the same tool twice, right-click
  "Open in new tab", state survives across tab switches and app
  restarts (persisted to `localStorage` key `hexkit:app`).
- **Pinned and recently-used tools** with right-click context menus
  in the sidebar.
- **Code-split tools and CodeMirror language grammars** — every tool
  is its own chunk, fetched on demand.
- **`hexkit://` deep-link handler** for opening tools with pre-filled
  inputs from external apps.

### Internal

- Pure-Rust core (`crates/devtools-core`) with one module per tool,
  uniform `ToolError` / `ToolResult`, and `#[cfg(test)]` coverage on
  every dispatcher path.
- Shared `run_action` Tauri command + headless `hexkit` CLI binary
  over the same dispatcher.
- Strict TypeScript (`noUnusedLocals`), Clippy with `-D warnings`,
  Vitest + Testing Library for the frontend.

[0.3.4]: https://github.com/trinvh/hexkit/releases/tag/v0.3.4
[0.3.3]: https://github.com/trinvh/hexkit/releases/tag/v0.3.3
[0.3.2]: https://github.com/trinvh/hexkit/releases/tag/v0.3.2
[0.3.1]: https://github.com/trinvh/hexkit/releases/tag/v0.3.1
[0.3.0]: https://github.com/trinvh/hexkit/releases/tag/v0.3.0
[0.2.0]: https://github.com/trinvh/hexkit/releases/tag/v0.2.0
[0.1.3]: https://github.com/trinvh/hexkit/releases/tag/v0.1.3
[0.1.2]: https://github.com/trinvh/hexkit/releases/tag/v0.1.2
[0.1.1]: https://github.com/trinvh/hexkit/releases/tag/v0.1.1
[0.1.0]: https://github.com/trinvh/hexkit/commits/v0.1.1
