---
name: hexkit-screenshots
description: Refresh the landing-page screenshot library for every Hexkit tool. Use when a new tool ships, the desktop UI changes, theme tokens move, or the /demo page needs a fresh capture pass. Drives scripts/capture-screenshots.sh end-to-end, prepares the desktop app first, syncs the resulting PNGs into hexkit-devutils-landing/public/screenshots/, and reminds the user about the deep-link routing prerequisite (ACTION_NAMESPACE_TO_TOOL) and the CLI-banner pitfall.
---

# Hexkit screenshots

Regenerate or refresh `public/screenshots/*.png` in
`hexkit-devutils-landing` by deep-linking through every tool in the
installed Hexkit.app and capturing each one with `screencapture`.

## Preconditions (verify in this order)

1. **CWD is hexkit-devutils repo root.** Check that
   `scripts/capture-screenshots.sh` and `src/tools/registry.ts` both
   exist. If not, `cd` there.
2. **macOS only.** The script uses Swift's
   `CGWindowListCopyWindowInfo` and `screencapture -l <CGWindowID>`.
   Bail out cleanly on other platforms.
3. **Hexkit.app installed and registered.** If `mdfind "kMDItemCFBundleIdentifier == 'com.hexkit.app'"`
   returns nothing, build + install + register first:
   ```bash
   make dev-bundle
   rm -rf /Applications/Hexkit.app
   cp -R target/debug/bundle/macos/Hexkit.app /Applications/
   /System/Library/Frameworks/CoreServices.framework/Frameworks/LaunchServices.framework/Support/lsregister \
       -f /Applications/Hexkit.app
   ```
   (DMG packaging in `make dev-bundle` often fails on debug builds — the
   `.app` is what we care about, the DMG error is benign.)
4. **CLI version matches the app.** If `hexkit --version` is older than
   the bundled app, the Hexkit window shows an "Update CLI" banner that
   ruins the top of every screenshot. Install the matching CLI:
   ```bash
   make cli && cp target/release/hexkit ~/.local/bin/
   ```
5. **New tools have routing.** Open `src/tools/registry.ts` and confirm
   `ACTION_NAMESPACE_TO_TOOL` maps every namespace the script uses
   (e.g. `yaml` → `yaml-json`, `qr` → `qr-code`, `x509` →
   `x509-decoder`). Missing entries silently fall through and the deep
   link leaves the app on whatever tool was already active — the
   classic "all my screenshots look like JSON formatter" symptom.

## The flow

Run these as separate steps so each one's output is visible.

### 1. Add new tools to the spec (if any)

For every tool that needs capturing but isn't already in the SPEC
heredoc at the bottom of `scripts/capture-screenshots.sh`, add one
tab-separated row:

```text
<action>	<output-filename-no-ext>	<seed-input-or-blank>
```

Pick a seed that exercises the tool visibly — `name: hexkit` for
yaml, a small JWT for `jwt.decode`, blank for generators
(`random.generate`, `lorem.generate`, …). Use real-looking
example data; "hello world" is not visually interesting.

Also confirm:
- The action exists in `crates/devtools-core/src/actions.rs`.
- The namespace prefix (everything before the first `.`) is mapped in
  `ACTION_NAMESPACE_TO_TOOL` in `src/tools/registry.ts`.

### 2. Run the capture script

Default — capture everything into `~/Desktop/hexkit-screenshots-auto`:

```bash
scripts/capture-screenshots.sh
```

Capture into a custom dir:

```bash
scripts/capture-screenshots.sh ./out
```

Filter by substring (handy when iterating on one tool):

```bash
scripts/capture-screenshots.sh ./out json   # only entries matching "json"
```

The script brings Hexkit to the foreground, opens
`hexkit://<action>?input=<urlencoded seed>` for each row, waits 1.8s
for the deep-link route + `useLiveAction` debounce + render, finds the
window whose `kCGWindowName == "Hexkit"` (not just owner — the process
owns several auxiliary surfaces), and writes a retina PNG.

Sanity check the output: file sizes should vary. If every PNG is
within a few KB of the same size, deep-link routing isn't switching
tools (see preconditions step 5).

### 3. Review the captures

Open the output folder and spot-check 5–10 tools across categories.
Reject any shot that:

- Shows the "Update CLI is out of date" banner (fix the CLI version
  and re-run).
- Shows the wrong tool (fix `ACTION_NAMESPACE_TO_TOOL` and re-run).
- Has an empty input (the seed wasn't loaded — check the URL encoding
  for special chars, or move the seed into the action's `input`
  param).

### 4. Sync into the landing repo

Copy the approved PNGs into the landing's screenshot folder:

```bash
cp ~/Desktop/hexkit-screenshots-auto/*.png \
   ../hexkit-devutils-landing/public/screenshots/
```

(Adjust the source path if you used a custom output dir.)

### 5. Wire screenshots into `src/data.ts`

In `hexkit-devutils-landing/src/data.ts`, every tool object can carry
an optional `screenshot:` field that points to a path under
`public/screenshots/`. For each tool that now has a PNG, add or update:

```ts
{ name: "YAML ↔ JSON", description: "…", screenshot: "/screenshots/yaml-to-json.png" }
```

Tools without a screenshot simply omit the field — the demo page
falls back to a "coming soon" placeholder. Keep the field optional;
do not invent a path that doesn't exist on disk.

### 6. Verify the demo locally

```bash
cd ../hexkit-devutils-landing
pnpm build && pnpm preview   # or `pnpm dev`
```

Visit `/demo` and scroll through. The sidebar scroll-spy should
highlight the right entry as each screenshot enters the focus band.

### 7. Commit each repo separately

`scripts/capture-screenshots.sh` and `src/tools/registry.ts` belong to
the **main repo**:

```text
feat: <what changed in the capture pipeline>
```

The PNGs and `src/data.ts` mappings belong to the **landing repo**:

```text
feat(demo): wire <N> auto-captured tool screenshots
```

Conventional commits, one per repo. Never cross repos in a single
commit message.

## What this skill does NOT do

- Does not push to GitHub. Commit locally and let the user decide
  when to push.
- Does not commit a screenshot whose corresponding tool produces no
  visible output (e.g. clipboard-only flows). Skip those rather than
  shipping a blank pane.
- Does not invent tool entries. The capture script's SPEC table is
  the source of truth for which tools are screenshot-able; if a tool
  isn't listed there, it isn't covered, and the demo page silently
  falls back to the placeholder.
- Does not run on Linux / Windows. The Swift + screencapture pipeline
  is macOS-only. CI is not a substitute.

## Common failure modes

| Symptom | Root cause | Fix |
|--------|-----------|-----|
| Every PNG looks like JSON formatter | New action's namespace missing from `ACTION_NAMESPACE_TO_TOOL` | Add the mapping in `src/tools/registry.ts`, rebuild + reinstall the app, re-run |
| All PNGs are ~300 KB and visually identical | Same as above — deep link silently fell through | Same fix |
| `✗ <name>: no window` for every shot | Hexkit.app minimized, hidden, or not registered with Launch Services | `open -a Hexkit`; if still failing, re-run `lsregister -f` |
| Top of every shot is the orange "Update CLI" banner | Installed CLI is older than the bundled app | `make cli && cp target/release/hexkit ~/.local/bin/` |
| Empty input field on shots | Seed has unencoded special chars (e.g. `&`, `#`) | Already handled by `urlencode` in the script — if you see it, the seed in SPEC probably contains a literal newline; quote/inline it |
| DMG step fails in `make dev-bundle` | `bundle_dmg.sh` flaking on debug builds | Ignore — use `target/debug/bundle/macos/Hexkit.app` directly |
