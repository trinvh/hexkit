# CLAUDE.md

Project guidance for Claude Code working in this repo. Read this before making
changes. (User-level rules in `~/.claude/` still apply; this file is the
project-specific layer.)

## What this is

**Hexkit** — a fast, **offline** cross-platform desktop developer toolbox
(~38 tools) built with **Tauri 2** (Rust core + system WebView) and **React 19**.
All tool logic lives in pure Rust; the UI is a thin client. Nothing the user
pastes ever leaves the machine.

## Related working directories (siblings, not subdirs)

Two sibling repos live next to this one and are commonly added to the same
session via `/add-dir`. Treat them as separate projects with their own
package managers and lockfiles — do not vendor them into this repo.

| Path                          | What it is                                                            |
| ----------------------------- | --------------------------------------------------------------------- |
| `../hexkit-devutils-landing`  | Marketing site for hexkit.app. Vite + React 19 + Tailwind v4, deployed to Cloudflare Workers with Static Assets. Worker reserves `/api/*` for future license endpoints. `make help` lists tasks. |
| `../hexkit-devutils-raycast`  | Raycast extension. Renders text-in/text-out tools inline by shelling out to the `hexkit` CLI; falls back to `hexkit://<action>?input=…` deep links for visual tools (color, QR, certs, diff). Tool catalog in `src/lib/tools.ts`; an `inline` flag toggles each tool's path. `npm run build` / `npm run dev`. |

When working across them:

- **Action ids and `hexkit://` deep links are the contract** between this
  repo and the Raycast extension. If you rename an action in
  `crates/devtools-core/src/actions.rs`, update `src/lib/tools.ts` in the
  Raycast repo to match.
- **The CLI surface is also part of that contract.** Inline Raycast
  commands shell out via `hexkit <action> '<json-params>'`; keep that
  signature stable (see `crates/hexkit-cli/src/lib.rs`).
- **Brand tokens live in this repo's `src/styles/globals.css`.** The
  landing site mirrors them in its own `src/index.css` `@theme` block —
  keep the two in sync when adjusting the palette.

## Architecture (the one rule that matters most)

**All tool logic lives in Rust, in `crates/devtools-core`.** The frontend never
implements tool logic — it calls the backend.

```
crates/devtools-core/   Pure, Tauri-independent logic. One module per tool, each
                        with a `dispatch(action, params) -> ToolResult<Value>` fn.
                        Routed by src/actions.rs `run(action, params)`.
crates/hexkit-cli/      Headless `hexkit` binary over the same dispatcher.
src-tauri/              Tauri shell: the single `run_action` command, clipboard,
                        deep link (`hexkit://`). Crate = `hexkit`, lib = `hexkit_lib`.
src/                    React UI: tool registry, shared primitives, per-tool views.
```

Every tool is reachable identically from the desktop app, the CLI, and
`hexkit://` deep links because they all route through `devtools_core::run`.

- Errors: return `ToolError` (`thiserror`, serialized `{kind, message}`).
- **Dispatch must propagate with `?`:** `to_value(convert(&p.input)?)`, never
  `to_value(convert(&p.input))` — the latter serializes the `Result` as
  `{"Ok": …}` and the UI silently shows nothing. (This was a real bug.)

## Frontend conventions

- **Tool registry** (`src/tools/registry.ts`) drives the sidebar, palette, and
  routing. Tool components are **lazy-loaded** (`React.lazy`) so each is its own
  chunk; CodeMirror language grammars are dynamically imported too.
- **One folder per tool** under `src/tools/<name>/`: `api.ts` (typed
  `runAction` wrappers), `run.ts` (mode options + a `run*` fn returning a
  `Promise | null`), `<Name>Tool.tsx`, and tests.
- **Shared IPC:** `runAction<T>(action, params)` in `src/lib/ipc.ts`. Live,
  debounced, race-cancelling calls via `useLiveAction`.
- **Shared UI primitives** (`src/components/ui/`): `TransformLayout` (input→output
  with toolbar, `outputFooter`, Paste/Sample/Clear), `ResultLayout` + `ResultList`
  (labelled rows), `CodeEditor` (CodeMirror, mocked as a `<textarea>` in tests),
  `Segmented`, `Toggle`, `TextField`, `CopyButton`, `Menu` (portal context menu),
  `InputActions` (Paste/Sample/Clear), `JsonView` (inline JSON highlighter).
  Reuse these; don't hand-roll layouts.
- **Per-tab persisted state:** use **`useToolState(field, initial)`** (a
  `useState` drop-in scoped to the active tab via `TabContext`) for inputs and
  option selections — NOT for derived outputs (those recompute via
  `useLiveAction`). State persists across tab switches and app restarts.
- **Tabs/store:** Zustand store `src/store/app.ts` (persisted to localStorage key
  `hexkit:app`: `tabs`, `activeTabId`, `tabState`, `pinned`, `recents`, collapse
  flags). `activeToolId` mirrors the active tab. `useSeed` carries one-shot
  prefill for smart-detect.

## Adding a tool (the standard flow)

1. **Rust first, test-first.** New module in `crates/devtools-core/src/<name>.rs`
   with a pure fn + `dispatch`; route it in `actions.rs` and declare it in
   `lib.rs`. Write unit tests (happy path, edge cases, error cases) and confirm
   RED before implementing.
2. Add the frontend `src/tools/<name>/` (`api.ts`, `run.ts`, view) and register
   in `registry.ts`. Use `useToolState` for inputs/options.
3. Add `run.test.ts` (pure logic) and `<Name>Tool.test.tsx` (component).
4. **Propagate to the sibling repos and READMEs.** Every new tool — and every
   meaningful change to an existing tool's usage — must land in all four
   places below in the same change set. If a piece is genuinely missing
   (no screenshot taken yet, no Raycast inline view implemented, etc.),
   write that down explicitly in the corresponding file with a "not yet
   available" line — never silently omit it, because future-me will assume
   it was an oversight.
   - **`README.md`** — add the tool to the Tools section, and if it's
     callable from the CLI, add a one-line example to the
     `## The hexkit CLI` cheatsheet. If there's no representative screenshot
     yet, note "Screenshot not yet available" in any tool-spotlight section
     that would normally have one.
   - **`../hexkit-devutils-landing/src/data.ts`** — append to the right
     `TOOL_CATEGORIES` entry. If you cross a tool-count threshold,
     bump `TOOL_COUNT` in `App.tsx`. Rebuild with `make build` to confirm
     the bundle still fits the budget.
   - **`../hexkit-devutils-raycast/src/lib/tools.ts`** — add a `ToolEntry`
     with the action id, title, kind, `inline` flag, icon, and keywords.
     For tools whose UI can plausibly render inside Raycast (text-in /
     text-out), set `inline: true` and either reuse `Search Tools` or
     add a dedicated `src/<command>.tsx` + `package.json` command. For
     visual-only tools (color, QR, diff, certificates, anything with
     custom layout), set `inline: false` — the extension will fall back
     to the `hexkit://` deep link. If you choose not to add an inline
     view today, leave a `// TODO: inline view not yet implemented`
     comment so future passes can find it.
   - **Cross-repo contract refresher** — action ids and `hexkit://` deep
     links are the wire between this repo and the Raycast extension; if
     you rename an action in `actions.rs`, every entry in
     `src/lib/tools.ts` over there must move with it.

## Testing & the gate

TDD is expected: **write the failing test first (RED), then implement (GREEN).**

- Rust: `#[cfg(test)]` unit tests per module; `rstest` for params. Backend logic
  is covered here, not in the UI.
- Frontend: Vitest + Testing Library. Mock the editor
  (`vi.mock("../../components/ui/CodeEditor", …)` → textarea) and IPC with the
  **invokeSpy/invokeImpl pattern** (spy records args; a plain impl returns the
  value/rejection so Vitest doesn't flag unhandled rejections). Reset the store
  in `beforeEach` when a test depends on tabs/pinned/recents.

**Before calling anything done, run the full gate and make it green:**

```bash
make check     # typecheck + clippy (-D warnings) + cargo test + vitest + build
```

Individual: `make test`, `make build`, `make dev` (desktop), `make web`
(browser-only), `make cli`. See `make help`.

## Releases

`/hexkit-release` (or `make release VERSION=X.Y.Z`) bumps the four
version-of-record files, runs the gate, commits `chore: release vX.Y.Z`,
and tags `vX.Y.Z`. Pushing the tag fires `.github/workflows/release.yml`,
which now ends with a `publish` job that flips the draft to a published
GitHub release automatically — no manual click required.

**After every main-repo release, also commit and push pending work in
the sibling repos** (`../hexkit-devutils-landing`, `../hexkit-devutils-raycast`).
The three repos version on their own cadence, but the moment of a Hexkit
release is the natural sync point — any new tools or renamed action ids
landed in the main repo are reflected in the landing's `TOOL_CATEGORIES`
and the Raycast `package.json` `commands` array, and if those changes
sit uncommitted the cross-repo contract drifts. Walk both sibling
working directories, `git status` each, commit anything outstanding
with conventional-commit messages, and push if they have remotes
configured.

## Hard rules / gotchas

- **`noUnusedLocals` is on** (strict TS). Remove now-unused imports when you
  refactor, or `tsc` fails. Clippy runs with `-D warnings`.
- **Prefer the `Edit` tool over `sed`.** A PostToolUse hook reformats files
  (`cargo fmt` / prettier) after writes — re-read before editing if needed.
- **Web preview can't reach the Tauri backend.** Running `pnpm dev` / browser
  screenshots show `Cannot read properties of undefined (reading 'invoke')` for
  any tool that calls the backend. That's expected — verify logic via tests; real
  behavior only in `pnpm tauri dev`. Frontend-only behavior (tabs, persistence,
  highlighting) *does* work in the browser.
- **Commit per feature**, conventional commits (`feat:`/`fix:`/`refactor:`/
  `test:`/`docs:`/`chore:`/`ci:`). Only commit when asked; the user reviews/tests.
- **Latest versions:** prefer current stable releases of libraries/models.

## Licensing & publishing

- Licensed **PolyForm Noncommercial 1.0.0** (`LICENSE`) — source-available, free
  for personal/non-commercial use; commercial use needs a paid license. It is
  **not** OSI "open source" (don't call it that).
- A Raycast extension and some advanced features (e.g. multi-tab workflows) are
  intended to require a paid license in the future.
- **Do not reference other developer-toolbox products** anywhere in source,
  comments, or commit messages.

## Tech stack

Tauri 2 · Rust (serde, thiserror, jiff, similar, fancy-regex, sxd-xpath,
serde_json_path, hmac, sha2/sha1/md-5, csscolorparser, saffron, quick-xml,
malva/markup_fmt/lightningcss/minify-js, …) · React 19 · TypeScript (strict) ·
Vite · Tailwind v4 · Zustand (persist) · CodeMirror 6 · Vitest.
