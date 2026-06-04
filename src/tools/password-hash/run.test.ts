import { describe, it, expect, vi, beforeEach } from "vitest";

const pwHash = vi.fn();
const pwVerify = vi.fn();
vi.mock("./api", () => ({
  pwHash: (...a: unknown[]) => pwHash(...a),
  pwVerify: (...a: unknown[]) => pwVerify(...a),
}));

import { runHash, runVerify } from "./run";

describe("runHash", () => {
  beforeEach(() => {
    pwHash.mockReset();
    pwVerify.mockReset();
  });

  it("returns null for empty password", () => {
    expect(runHash("bcrypt", "")).toBeNull();
    expect(pwHash).not.toHaveBeenCalled();
  });

  it("hashes a non-empty password", () => {
    pwHash.mockReturnValue(Promise.resolve({ hash: "$2b$..." }));
    runHash("bcrypt", "hunter2");
    expect(pwHash).toHaveBeenCalledWith("bcrypt", "hunter2");
  });
});

describe("runVerify", () => {
  beforeEach(() => {
    pwHash.mockReset();
    pwVerify.mockReset();
  });

  it("returns null until both password and hash are present", () => {
    expect(runVerify("bcrypt", "", "$2b$...")).toBeNull();
    expect(runVerify("bcrypt", "hunter2", "")).toBeNull();
    expect(pwVerify).not.toHaveBeenCalled();
  });

  it("resolves to 'valid' when the password matches", async () => {
    pwVerify.mockReturnValue(Promise.resolve({ valid: true }));
    const result = await runVerify("argon2", "hunter2", "$argon2id$...")!;
    expect(pwVerify).toHaveBeenCalledWith("argon2", "hunter2", "$argon2id$...");
    expect(result).toBe("valid");
  });

  it("resolves to 'invalid' when the password does not match", async () => {
    pwVerify.mockReturnValue(Promise.resolve({ valid: false }));
    const result = await runVerify("bcrypt", "wrong", "$2b$...")!;
    expect(result).toBe("invalid");
  });
});
