import { describe, it, expect, vi, beforeEach } from "vitest";

const tomlToJson = vi.fn();
const tomlFromJson = vi.fn();
const tomlToYaml = vi.fn();
const tomlFromYaml = vi.fn();
vi.mock("./api", () => ({
  tomlToJson: (...a: unknown[]) => tomlToJson(...a),
  tomlFromJson: (...a: unknown[]) => tomlFromJson(...a),
  tomlToYaml: (...a: unknown[]) => tomlToYaml(...a),
  tomlFromYaml: (...a: unknown[]) => tomlFromYaml(...a),
}));

import { runToml } from "./run";

describe("runToml", () => {
  beforeEach(() => {
    tomlToJson.mockReset();
    tomlFromJson.mockReset();
    tomlToYaml.mockReset();
    tomlFromYaml.mockReset();
  });

  it("returns null for blank input", () => {
    expect(runToml("  ", "to_json")).toBeNull();
  });

  it("routes by mode", () => {
    tomlToJson.mockReturnValue(Promise.resolve("{}"));
    runToml("a = 1", "to_json");
    expect(tomlToJson).toHaveBeenCalledWith("a = 1");

    tomlFromJson.mockReturnValue(Promise.resolve("a = 1"));
    runToml("{}", "from_json");
    expect(tomlFromJson).toHaveBeenCalledWith("{}");

    tomlToYaml.mockReturnValue(Promise.resolve("a: 1"));
    runToml("a = 1", "to_yaml");
    expect(tomlToYaml).toHaveBeenCalledWith("a = 1");

    tomlFromYaml.mockReturnValue(Promise.resolve("a = 1"));
    runToml("a: 1", "from_yaml");
    expect(tomlFromYaml).toHaveBeenCalledWith("a: 1");
  });
});
