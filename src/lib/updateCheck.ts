import { APP_VERSION, GITHUB_URL, RELEASES_URL } from "./version";

const RELEASES_API = `https://api.github.com/repos/trinvh/hexkit/releases?per_page=30`;

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
 */
export async function checkForUpdate(): Promise<UpdateCheckResult> {
  const response = await fetch(RELEASES_API, {
    headers: { Accept: "application/vnd.github+json" },
  });

  if (response.status === 404) {
    return baseResult("repo-not-found");
  }
  if (!response.ok) {
    throw new Error(`GitHub returned ${response.status} ${response.statusText}`);
  }

  const releases = (await response.json()) as ReleaseResponse[];
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
