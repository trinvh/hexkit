#!/usr/bin/env node
// Bump every Hexkit version-of-record to the requested semver string.
//
// Files touched:
//   - Cargo.toml          (workspace.package.version — all 3 crates inherit it)
//   - src-tauri/tauri.conf.json
//   - package.json
//
// Refuses to run if the working tree is dirty (unless --allow-dirty is passed)
// so callers can trust the resulting commit. After updating the files it runs
// `cargo check --workspace` to refresh Cargo.lock and surface any issues.

import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

function fail(message) {
  console.error(`bump: ${message}`);
  process.exit(1);
}

function parseArgs(argv) {
  const args = { allowDirty: false, skipCargoCheck: false, version: null };
  for (const arg of argv.slice(2)) {
    if (arg === "--allow-dirty") args.allowDirty = true;
    else if (arg === "--skip-cargo-check") args.skipCargoCheck = true;
    else if (arg.startsWith("--")) fail(`unknown flag: ${arg}`);
    else if (!args.version) args.version = arg;
    else fail(`unexpected argument: ${arg}`);
  }
  if (!args.version) {
    fail("usage: node scripts/bump.mjs <version> [--allow-dirty] [--skip-cargo-check]");
  }
  return args;
}

// SemVer 2.0.0 core (we don't accept pre-release/build metadata — keep the
// surface tiny so the comparison logic in cli_tools.rs stays simple).
const SEMVER_RE = /^\d+\.\d+\.\d+$/;

function ensureSemver(version) {
  if (!SEMVER_RE.test(version)) {
    fail(`"${version}" is not a MAJOR.MINOR.PATCH semver string`);
  }
}

function ensureCleanTree() {
  const stdout = execFileSync("git", ["status", "--porcelain"], {
    cwd: ROOT,
    encoding: "utf8",
  });
  // A modified CHANGELOG.md is an expected part of a release (the
  // hexkit-release skill updates it just before bumping), so it doesn't count
  // as "dirty" — `make release` stages it into the release commit alongside
  // the version files. Everything else must be clean.
  const dirty = stdout
    .split("\n")
    .map((line) => line.replace(/\s+$/, ""))
    .filter((line) => line.length > 0)
    .filter((line) => line.slice(3) !== "CHANGELOG.md");
  if (dirty.length > 0) {
    fail(
      "working tree is dirty. Commit or stash first, or pass --allow-dirty:\n" +
        dirty.join("\n"),
    );
  }
}

function bumpWorkspaceCargo(version) {
  const path = join(ROOT, "Cargo.toml");
  const raw = readFileSync(path, "utf8");
  const re = /(\[workspace\.package\][\s\S]*?\nversion\s*=\s*")[^"]+(")/;
  if (!re.test(raw)) {
    fail("could not find [workspace.package] version in Cargo.toml");
  }
  const updated = raw.replace(re, `$1${version}$2`);
  writeFileSync(path, updated);
  return path;
}

// String-based replace so we don't reformat the rest of the file. We still
// parse first to validate that the JSON is intact and to find the *exact*
// existing value (so the regex can target the first match without ambiguity).
function bumpTopLevelJsonVersion(absPath, newVersion) {
  const raw = readFileSync(absPath, "utf8");
  const parsed = JSON.parse(raw);
  if (typeof parsed.version !== "string") {
    fail(`${absPath}: missing top-level "version" field`);
  }
  if (parsed.version === newVersion) return absPath;

  const escaped = parsed.version.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`("version"\\s*:\\s*")${escaped}(")`);
  if (!re.test(raw)) {
    fail(`${absPath}: could not locate "version" line to rewrite`);
  }
  const updated = raw.replace(re, `$1${newVersion}$2`);
  writeFileSync(absPath, updated);
  return absPath;
}

function bumpTauriConf(version) {
  return bumpTopLevelJsonVersion(join(ROOT, "src-tauri/tauri.conf.json"), version);
}

function bumpPackageJson(version) {
  return bumpTopLevelJsonVersion(join(ROOT, "package.json"), version);
}

function runCargoCheck() {
  execFileSync("cargo", ["check", "--workspace", "--quiet"], {
    cwd: ROOT,
    stdio: "inherit",
  });
}

function main() {
  const { version, allowDirty, skipCargoCheck } = parseArgs(process.argv);
  ensureSemver(version);
  if (!allowDirty) ensureCleanTree();

  const touched = [
    bumpWorkspaceCargo(version),
    bumpTauriConf(version),
    bumpPackageJson(version),
  ];

  if (!skipCargoCheck) {
    runCargoCheck();
  }

  console.log(`bumped to ${version}:`);
  for (const f of touched) console.log(`  ${f.replace(ROOT + "/", "")}`);
}

main();
