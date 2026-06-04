import { describe, it, expect, vi, afterEach } from "vitest";
import {
  ALGORITHM_OPTIONS,
  DIGIT_OPTIONS,
  PERIOD_OPTIONS,
  nowUnixSeconds,
} from "./run";

afterEach(() => {
  vi.useRealTimers();
});

describe("totp run options", () => {
  it("offers SHA-1, SHA-256, and SHA-512", () => {
    expect(ALGORITHM_OPTIONS.map((o) => o.value)).toEqual([
      "SHA1",
      "SHA256",
      "SHA512",
    ]);
  });

  it("offers 6 and 8 digit options", () => {
    expect(DIGIT_OPTIONS.map((o) => o.value)).toEqual(["6", "8"]);
  });

  it("offers 30s and 60s periods", () => {
    expect(PERIOD_OPTIONS.map((o) => o.value)).toEqual(["30", "60"]);
  });
});

describe("nowUnixSeconds", () => {
  it("returns whole seconds from the wall clock", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(59_000));
    expect(nowUnixSeconds()).toBe(59);
  });

  it("floors sub-second milliseconds", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(1500));
    expect(nowUnixSeconds()).toBe(1);
  });
});
