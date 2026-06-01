---
name: hexkit-release
description: Cut a Hexkit release — update the changelog, bump every version-of-record, run the gate, commit, and tag. Use when the user asks to "release", "ship a version", "cut vX.Y.Z", "bump and tag", "tag a release", or otherwise wants to publish a new Hexkit version. Operates only on the hexkit-devutils repo (the desktop app + CLI); the landing page and Raycast extension version independently.
---

# Hexkit release

Drive `make release` end-to-end, then push the branch and tag so the release
workflow builds and publishes. **Updating `CHANGELOG.md` is a required part of
every release — never skip it.**

## Preconditions (verify in this order)

1. CWD is the hexkit-devutils repo root. Check by ensuring `Cargo.toml`,
   `src-tauri/`, and `scripts/bump.mjs` all exist. If not, ask the user to
   `cd` there.
2. The target version is a bare `X.Y.Z` semver. If the user said "patch",
   "minor" or "major" instead of a number, read the current version from
   `[workspace.package]` in `Cargo.toml` and compute the next one (don't
   guess). Confirm the resulting number with the user before continuing.
3. Working tree is clean: `git status --porcelain` must be empty. If it
   isn't, show the dirty files and ask whether to stash, commit, or abort.
   Do NOT pass `--allow-dirty` to `bump.mjs` on the user's behalf.
4. Branch sanity: the user is usually on `main`. If they're on a feature
   branch, confirm they actually want to tag from there.

## The flow

Run these as separate steps so each one's output is visible:

0. **Update `CHANGELOG.md` (mandatory).** Before bumping, add a section for the
   new version so the release is documented:
   - Read the current `CHANGELOG.md` (Keep a Changelog format) and find the
     previous released version + tag.
   - Determine what changed since then: run
     `git log --oneline <last-tag>..HEAD` and group commits by type
     (Added / Changed / Fixed / etc.). Summarize for humans — don't just paste
     commit subjects.
   - Insert a new `## [X.Y.Z] - YYYY-MM-DD` section above the previous one
     (use today's date), and roll any `## [Unreleased]` notes into it. Add/refresh
     the version-compare link at the bottom if the file uses them.
   - Show the user the new section and confirm it reads correctly before
     continuing. Leave `CHANGELOG.md` modified-but-uncommitted — the next step
     stages it into the release commit. (`scripts/bump.mjs` deliberately
     tolerates a dirty `CHANGELOG.md`; any *other* dirty file still aborts.)

1. `make release VERSION=<X.Y.Z>` — this delegates to `scripts/bump.mjs`
   (rewriting `Cargo.toml`'s `[workspace.package].version`,
   `src-tauri/tauri.conf.json`, and `package.json`), then runs the gate
   (`make check`: typecheck + clippy + tests + build), stages the four
   version files plus `Cargo.lock` **and the `CHANGELOG.md` you just edited**,
   creates `chore: release vX.Y.Z`, and creates the annotated `vX.Y.Z` tag.
2. After `make release` finishes, run `git log -1 --oneline` and
   `git tag --points-at HEAD` so the commit + tag are visible.
3. **Push automatically — no confirmation needed.** Push the branch first,
   then the tag (pushing the tag is what fires
   `.github/workflows/release.yml` and creates the draft GitHub release):

   ```text
   git push origin <current-branch>
   git push origin v<X.Y.Z>
   ```

   Substitute the real branch (`git rev-parse --abbrev-ref HEAD`) and version.
   If a push fails (e.g. non-fast-forward, no network, auth), stop and report
   the error rather than force-pushing.
4. Point at the Actions URL so the build is easy to watch:
   `https://github.com/trinvh/hexkit/actions`.

## When things go wrong

- Gate fails (`make check` returns non-zero inside `make release`): the
  bump already wrote the version files but no commit was made. Show the
  failure, then either fix forward (run the failing target manually,
  re-run `make check`, then `git commit` + `git tag` by hand) or roll
  back with `git checkout -- Cargo.toml Cargo.lock src-tauri/tauri.conf.json package.json`
  and let the user re-run after fixing the underlying issue. Ask the user
  which path to take.
- Tag already exists (`fatal: tag 'vX.Y.Z' already exists`): never delete
  a published tag silently. Ask the user; default to bumping patch (e.g.
  propose `X.Y.(Z+1)`).
- Workspace dirty after `make release` somehow: usually means a
  PostToolUse formatter rewrote a file. Inspect the diff, amend the
  release commit if it's purely formatting, otherwise ask the user.

## What this skill does NOT do

- Does not bump the landing page or Raycast extension — those repos
  version on their own cadence.
- Does not publish the draft GitHub release. After the workflow uploads
  installers and CLI archives, the user opens the draft on GitHub, writes
  notes, and clicks Publish themselves.
- Does not create signed-and-notarized macOS builds unless the Apple
  signing secrets are configured in the workflow (commented out today).
  Mention this once if the user is releasing publicly.

## Notes for the editor

- The `make bump` target alone (without `release`) is fine for the
  bump-only case (e.g. when iterating before the gate passes). Skip
  straight to step 1 in that case and stop after the bump.
- `scripts/bump.mjs` accepts `--allow-dirty` and `--skip-cargo-check`
  for advanced use. Don't expose them by default — they exist for
  hand-driven recovery, not the happy path.
