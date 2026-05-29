import { describe, it, expect } from "vitest";
import { TOOLS, getTool, DEFAULT_TOOL_ID, toolIdForAction } from "./registry";
import { CATEGORY_ORDER } from "./types";

describe("tool registry", () => {
  it("has unique tool ids", () => {
    const ids = TOOLS.map((tool) => tool.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("gives every tool the required fields and a known category", () => {
    for (const tool of TOOLS) {
      expect(tool.id).toBeTruthy();
      expect(tool.name).toBeTruthy();
      expect(tool.description).toBeTruthy();
      expect(tool.keywords.length).toBeGreaterThan(0);
      expect(tool.icon).toBeTruthy();
      expect(CATEGORY_ORDER).toContain(tool.category);
    }
  });

  it("looks tools up by id", () => {
    expect(getTool("json-format")?.name).toContain("JSON");
    expect(getTool("does-not-exist")).toBeUndefined();
  });

  it("defaults to the first tool", () => {
    expect(DEFAULT_TOOL_ID).toBe(TOOLS[0].id);
  });

  it("has the JSON tool wired to a component", () => {
    expect(getTool("json-format")?.component).toBeDefined();
  });

  it("wires a component for every tool", () => {
    for (const tool of TOOLS) {
      expect(tool.component, `${tool.id} has no component`).toBeDefined();
    }
  });
});

describe("toolIdForAction", () => {
  it("maps namespaced actions to their tool", () => {
    expect(toolIdForAction("base64.encode")).toBe("base64-string");
    expect(toolIdForAction("hash.generate")).toBe("hash-generator");
    expect(toolIdForAction("id.generate")).toBe("uuid-generator");
  });

  it("disambiguates the url namespace by verb", () => {
    expect(toolIdForAction("url.encode")).toBe("url-encode");
    expect(toolIdForAction("url.parse")).toBe("url-parser");
  });

  it("returns undefined for unknown namespaces", () => {
    expect(toolIdForAction("mystery.thing")).toBeUndefined();
  });

  it("resolves to a real registered tool", () => {
    const id = toolIdForAction("jwt.decode");
    expect(id && getTool(id)).toBeTruthy();
  });
});
