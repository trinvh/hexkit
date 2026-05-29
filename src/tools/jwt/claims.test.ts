import { describe, it, expect } from "vitest";
import { humanizeClaims, isExpired, algorithmOf } from "./claims";

describe("algorithmOf", () => {
  it("reads the alg from a decoded header", () => {
    expect(algorithmOf('{"alg":"HS256","typ":"JWT"}')).toBe("HS256");
  });

  it("returns null when alg is missing or invalid", () => {
    expect(algorithmOf('{"typ":"JWT"}')).toBeNull();
    expect(algorithmOf("not json")).toBeNull();
  });
});

describe("humanizeClaims", () => {
  it("renders iat / nbf / exp as ISO timestamps", () => {
    const payload = JSON.stringify({ iat: 1516239022, exp: 1516242622, sub: "x" });
    const rows = humanizeClaims(payload);
    const labels = rows.map((r) => r.label);
    expect(labels).toContain("Issued at");
    expect(labels).toContain("Expires");
    const issued = rows.find((r) => r.label === "Issued at")!;
    expect(issued.value).toContain("2018-01-18");
  });

  it("ignores non-numeric time claims", () => {
    const rows = humanizeClaims(JSON.stringify({ iat: "nope", sub: "x" }));
    expect(rows).toHaveLength(0);
  });

  it("returns nothing for invalid JSON", () => {
    expect(humanizeClaims("{not json}")).toEqual([]);
  });
});

describe("isExpired", () => {
  it("is true when now is past exp", () => {
    expect(isExpired(JSON.stringify({ exp: 1000 }), 2000)).toBe(true);
  });

  it("is false when now is before exp", () => {
    expect(isExpired(JSON.stringify({ exp: 5000 }), 2000)).toBe(false);
  });

  it("is null when there is no exp claim", () => {
    expect(isExpired(JSON.stringify({ sub: "x" }), 2000)).toBeNull();
  });
});
