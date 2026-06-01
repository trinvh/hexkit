import { invoke } from "@tauri-apps/api/core";
import { APP_VERSION, GITHUB_URL, RELEASES_URL } from "./version";

/** Raw probe handed back by the Rust `fetch_latest_releases` command. */
interface ReleasesProbe {
  status: number;
  body: string;
  /** GitHub refused because the API rate limit is exhausted. */
  rateLimited: boolean;
  /** Unix epoch (seconds) when the limit resets, from `x-ratelimit-reset`. */
  rateLimitReset: number | null;
}

export type UpdateCheckKind =
  /** Local app is at or above the latest published release. */
  | "up-to-date"
  /** A newer non-draft, non-prerelease release exists. */
  | "update-available"
  /** Repo exists but has no eligible published releases yet. */
  | "no-releases"
  /** GitHub couldn't find the repo at all. */
  | "repo-not-found";

export interface UpdateCheckResult {
  kind: UpdateCheckKind;
  current: string;
  /** Latest published release version (semver, no leading `v`). */
  latest: string | null;
  /** True iff `kind === "update-available"`. */
  updateAvailable: boolean;
  /** GitHub release page for `latest`, when one exists. */
  releaseUrl: string | null;
  body: string | null;
}

interface ReleaseResponse {
  tag_name?: string;
  html_url?: string;
  body?: string | null;
  draft?: boolean;
  prerelease?: boolean;
}

/**
 * Hit GitHub's releases list and report what we should tell the user. Uses
 * `/releases` (not `/releases/latest`) so a brand-new repo with no published
 * releases returns 200 + `[]` instead of 404, which lets us distinguish "no
 * releases yet" from "the repo is missing".
 *
 * The request runs in Rust (`fetch_latest_releases`) rather than the webview
 * `fetch`: GitHub's API returns 403 to requests without a `User-Agent`, and the
 * browser `fetch` can't set that header. Only meaningful inside the desktop app.
 */
export async function checkForUpdate(): Promise<UpdateCheckResult> {
  const probe = await invoke<ReleasesProbe>("fetch_latest_releases");

  if (probe.status === 404) {
    return baseResult("repo-not-found");
  }
  if (probe.rateLimited) {
    throw new Error(rateLimitMessage(probe.rateLimitReset));
  }
  if (probe.status < 200 || probe.status >= 300) {
    throw new Error(`GitHub returned ${probe.status}`);
  }

  const releases = JSON.parse(probe.body) as ReleaseResponse[];
  const eligible = releases.find(
    (r) => !r.draft && !r.prerelease && typeof r.tag_name === "string" && r.tag_name.length > 0,
  );
  if (!eligible) {
    return baseResult("no-releases");
  }

  const latest = (eligible.tag_name ?? "").replace(/^v/i, "");
  const updateAvailable = compareSemver(latest, APP_VERSION) > 0;
  return {
    kind: updateAvailable ? "update-available" : "up-to-date",
    current: APP_VERSION,
    latest,
    updateAvailable,
    releaseUrl: eligible.html_url ?? RELEASES_URL,
    body: eligible.body ?? null,
  };
}

/**
 * Friendly message for an exhausted GitHub rate limit, including when to retry
 * (derived from the `x-ratelimit-reset` epoch). Unauthenticated API requests
 * share a 60/hour-per-IP budget, so this is most likely on shared/VPN IPs.
 */
function rateLimitMessage(resetEpochSeconds: number | null): string {
  if (resetEpochSeconds == null) {
    return "GitHub's API rate limit is exhausted. Please try again later.";
  }
  const resetMs = resetEpochSeconds * 1000;
  const minutes = Math.max(1, Math.round((resetMs - Date.now()) / 60_000));
  const clock = new Date(resetMs).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
  return `GitHub's API rate limit is exhausted. Try again in ~${minutes} min (around ${clock}).`;
}

function baseResult(kind: Extract<UpdateCheckKind, "no-releases" | "repo-not-found">): UpdateCheckResult {
  return {
    kind,
    current: APP_VERSION,
    latest: null,
    updateAvailable: false,
    releaseUrl: kind === "no-releases" ? RELEASES_URL : GITHUB_URL,
    body: null,
  };
}

/**
 * Strict major.minor.patch comparison. Returns >0 if `a > b`, 0 if equal,
 * <0 if `a < b`. Pre-release tails are ignored — keep this aligned with the
 * Rust comparator in `src-tauri/src/cli_tools.rs`.
 */
export function compareSemver(a: string, b: string): number {
  const pa = splitSemver(a);
  const pb = splitSemver(b);
  for (let i = 0; i < 3; i++) {
    if (pa[i] !== pb[i]) return pa[i] - pb[i];
  }
  return 0;
}

function splitSemver(v: string): [number, number, number] {
  const cleaned = v.trim().replace(/^v/i, "").split(/[-+]/)[0];
  const parts = cleaned.split(".").map((p) => Number.parseInt(p, 10) || 0);
  return [parts[0] ?? 0, parts[1] ?? 0, parts[2] ?? 0];
}
