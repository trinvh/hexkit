/**
 * Size beyond which a text value is treated as "large" and given degraded but
 * responsive handling: it is **not** persisted to localStorage (serializing
 * megabytes on every edit blocks the main thread) and is **not** syntax-
 * highlighted (CodeMirror tokenizing/wrapping a huge document is synchronous and
 * janky). Chosen well above any normal tool input so everyday use is unaffected.
 */
export const LARGE_TEXT_THRESHOLD = 100_000;

/** True when `value` exceeds {@link LARGE_TEXT_THRESHOLD} characters. */
export function isLargeText(value: string): boolean {
  return value.length > LARGE_TEXT_THRESHOLD;
}
