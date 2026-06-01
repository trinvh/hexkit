# Changelog

All notable changes to **Hexkit** are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Each release is also published at <https://github.com/trinvh/hexkit/releases>
with platform installers and a standalone `hexkit` CLI archive attached.

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

[0.1.3]: https://github.com/trinvh/hexkit/releases/tag/v0.1.3
[0.1.2]: https://github.com/trinvh/hexkit/releases/tag/v0.1.2
[0.1.1]: https://github.com/trinvh/hexkit/releases/tag/v0.1.1
[0.1.0]: https://github.com/trinvh/hexkit/commits/v0.1.1
