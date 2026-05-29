import { describe, it, expect, vi, beforeEach } from "vitest";

const xmlBeautify = vi.fn();
const xmlMinify = vi.fn();
const xmlQuery = vi.fn();
vi.mock("./api", () => ({
  xmlBeautify: (...a: unknown[]) => xmlBeautify(...a),
  xmlMinify: (...a: unknown[]) => xmlMinify(...a),
  xmlQuery: (...a: unknown[]) => xmlQuery(...a),
}));

import { runXml } from "./run";

describe("runXml", () => {
  beforeEach(() => {
    xmlBeautify.mockReset();
    xmlMinify.mockReset();
    xmlQuery.mockReset();
  });

  it("returns null for blank input", () => {
    expect(runXml("  ", "beautify")).toBeNull();
    expect(xmlBeautify).not.toHaveBeenCalled();
  });

  it("beautifies or minifies by mode", () => {
    xmlBeautify.mockReturnValue(Promise.resolve(""));
    runXml("<a/>", "beautify");
    expect(xmlBeautify).toHaveBeenCalledWith("<a/>");

    xmlMinify.mockReturnValue(Promise.resolve(""));
    runXml("<a/>", "minify");
    expect(xmlMinify).toHaveBeenCalledWith("<a/>");
  });

  it("queries with XPath when provided, taking precedence", () => {
    xmlQuery.mockReturnValue(Promise.resolve(""));
    runXml("<a/>", "beautify", { xpath: "//a" });
    expect(xmlQuery).toHaveBeenCalledWith("<a/>", "//a");
    expect(xmlBeautify).not.toHaveBeenCalled();
  });

  it("ignores a blank xpath", () => {
    xmlBeautify.mockReturnValue(Promise.resolve(""));
    runXml("<a/>", "beautify", { xpath: "   " });
    expect(xmlQuery).not.toHaveBeenCalled();
    expect(xmlBeautify).toHaveBeenCalled();
  });
});
