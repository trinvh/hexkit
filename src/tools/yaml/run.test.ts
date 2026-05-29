import { describe, it, expect, vi, beforeEach } from "vitest";

const yamlToJson = vi.fn();
const yamlFromJson = vi.fn();
vi.mock("./api", () => ({
  yamlToJson: (...a: unknown[]) => yamlToJson(...a),
  yamlFromJson: (...a: unknown[]) => yamlFromJson(...a),
}));

import { runYaml } from "./run";

describe("runYaml", () => {
  beforeEach(() => {
    yamlToJson.mockReset();
    yamlFromJson.mockReset();
  });

  it("returns null for blank input", () => {
    expect(runYaml("  ", "to_json")).toBeNull();
  });

  it("routes by mode", () => {
    yamlToJson.mockReturnValue(Promise.resolve("{}"));
    runYaml("a: 1", "to_json");
    expect(yamlToJson).toHaveBeenCalledWith("a: 1");

    yamlFromJson.mockReturnValue(Promise.resolve("a: 1"));
    runYaml("{}", "from_json");
    expect(yamlFromJson).toHaveBeenCalledWith("{}");
  });
});
