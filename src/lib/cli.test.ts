import { describe, expect, it } from "vitest";
import { classify, type CliStatus } from "./cli";

function makeStatus(overrides: Partial<CliStatus>): CliStatus {
  return {
    installedPath: null,
    installedVersion: null,
    appVersion: "0.1.0",
    versionOk: false,
    defaultInstallDir: "/x",
    defaultInstallPath: "/x/hexkit",
    installDirOnPath: false,
    bundledSidecarAvailable: true,
    ...overrides,
  };
}

describe("classify", () => {
  it("returns 'unknown' for null status (e.g. browser preview)", () => {
    expect(classify(null)).toBe("unknown");
  });

  it("returns 'missing' when no path is set", () => {
    expect(classify(makeStatus({ installedPath: null }))).toBe("missing");
  });

  it("returns 'outdated' when installed but versionOk=false", () => {
    expect(
      classify(
        makeStatus({
          installedPath: "/x/hexkit",
          installedVersion: "0.0.9",
          versionOk: false,
        }),
      ),
    ).toBe("outdated");
  });

  it("returns 'ok' when versionOk=true", () => {
    expect(
      classify(
        makeStatus({
          installedPath: "/x/hexkit",
          installedVersion: "0.1.0",
          versionOk: true,
        }),
      ),
    ).toBe("ok");
  });
});
