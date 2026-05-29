import { describe, it, expect, vi, beforeEach } from "vitest";

const jsonFormat = vi.fn();
const jsonMinify = vi.fn();
vi.mock("./api", () => ({
  jsonFormat: (...args: unknown[]) => jsonFormat(...args),
  jsonMinify: (...args: unknown[]) => jsonMinify(...args),
}));

import { runJson } from "./run";

describe("runJson", () => {
  beforeEach(() => {
    jsonFormat.mockReset();
    jsonMinify.mockReset();
  });

  it("returns null for blank input without calling the backend", () => {
    expect(runJson("", "  ")).toBeNull();
    expect(runJson("   \n\t ", "minify")).toBeNull();
    expect(jsonFormat).not.toHaveBeenCalled();
    expect(jsonMinify).not.toHaveBeenCalled();
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
    expect(jsonFormat).toHaveBeenCalledWith("{}", "    ");
    expect(jsonMinify).not.toHaveBeenCalled();
  });
});
