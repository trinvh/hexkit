import { describe, it, expect, vi, beforeEach } from "vitest";

const jsonFormat = vi.fn();
const jsonMinify = vi.fn();
const jsonQuery = vi.fn();
vi.mock("./api", () => ({
  jsonFormat: (...args: unknown[]) => jsonFormat(...args),
  jsonMinify: (...args: unknown[]) => jsonMinify(...args),
  jsonQuery: (...args: unknown[]) => jsonQuery(...args),
}));

import { runJson } from "./run";

describe("runJson", () => {
  beforeEach(() => {
    jsonFormat.mockReset();
    jsonMinify.mockReset();
    jsonQuery.mockReset();
  });

  it("returns null for blank input without calling the backend", () => {
    expect(runJson("", "  ")).toBeNull();
    expect(runJson("   \n\t ", "minify")).toBeNull();
    expect(jsonFormat).not.toHaveBeenCalled();
    expect(jsonMinify).not.toHaveBeenCalled();
    expect(jsonQuery).not.toHaveBeenCalled();
  });

  it("minifies in minify mode", () => {
    jsonMinify.mockReturnValue(Promise.resolve("{}"));
    runJson("{ }", "minify");
    expect(jsonMinify).toHaveBeenCalledWith("{ }");
    expect(jsonFormat).not.toHaveBeenCalled();
  });

  it("formats with the chosen indent otherwise", () => {
    jsonFormat.mockReturnValue(Promise.resolve("{}"));
    runJson("{}", "    ");
    expect(jsonFormat).toHaveBeenCalledWith("{}", "    ", false);
    expect(jsonMinify).not.toHaveBeenCalled();
  });

  it("passes the sort flag through to jsonFormat", () => {
    jsonFormat.mockReturnValue(Promise.resolve("{}"));
    runJson("{}", "  ", { sort: true });
    expect(jsonFormat).toHaveBeenCalledWith("{}", "  ", true);
  });

  it("queries with JSONPath when a path is provided, taking precedence", () => {
    jsonQuery.mockReturnValue(Promise.resolve("[]"));
    runJson("{}", "  ", { path: "$.a" });
    expect(jsonQuery).toHaveBeenCalledWith("{}", "$.a", "  ");
    expect(jsonFormat).not.toHaveBeenCalled();
    expect(jsonMinify).not.toHaveBeenCalled();
  });

  it("uses two-space indent for query output when minify is selected", () => {
    jsonQuery.mockReturnValue(Promise.resolve("[]"));
    runJson("{}", "minify", { path: "$.a" });
    expect(jsonQuery).toHaveBeenCalledWith("{}", "$.a", "  ");
  });

  it("ignores a blank/whitespace path", () => {
    jsonFormat.mockReturnValue(Promise.resolve("{}"));
    runJson("{}", "  ", { path: "   " });
    expect(jsonQuery).not.toHaveBeenCalled();
    expect(jsonFormat).toHaveBeenCalled();
  });
});
