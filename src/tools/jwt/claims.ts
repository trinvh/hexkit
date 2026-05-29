export interface ClaimRow {
  label: string;
  value: string;
}

/** Standard registered time claims, in display order. */
const TIME_CLAIMS: ReadonlyArray<[key: string, label: string]> = [
  ["iat", "Issued at"],
  ["nbf", "Not before"],
  ["exp", "Expires"],
];

function parseObject(json: string): Record<string, unknown> | null {
  try {
    const value = JSON.parse(json);
    return typeof value === "object" && value !== null
      ? (value as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

/** Render the registered time claims (iat/nbf/exp) as ISO-8601 timestamps. */
export function humanizeClaims(payloadJson: string): ClaimRow[] {
  const obj = parseObject(payloadJson);
  if (!obj) return [];
  const rows: ClaimRow[] = [];
  for (const [key, label] of TIME_CLAIMS) {
    const value = obj[key];
    if (typeof value === "number" && Number.isFinite(value)) {
      rows.push({ label, value: new Date(value * 1000).toISOString() });
    }
  }
  return rows;
}

/** Extract the `alg` from a decoded JWT header (e.g. "HS256"), or null. */
export function algorithmOf(headerJson: string): string | null {
  const obj = parseObject(headerJson);
  const alg = obj?.alg;
  return typeof alg === "string" && alg !== "" ? alg : null;
}

/**
 * Whether the token is past its `exp` at `nowSeconds`. Returns `null` when
 * there is no usable `exp` claim.
 */
export function isExpired(payloadJson: string, nowSeconds: number): boolean | null {
  const obj = parseObject(payloadJson);
  const exp = obj?.exp;
  if (typeof exp === "number" && Number.isFinite(exp)) {
    return nowSeconds >= exp;
  }
  return null;
}
