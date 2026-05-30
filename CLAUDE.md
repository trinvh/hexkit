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
