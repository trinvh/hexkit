import { describe, it, expect, vi, beforeEach } from "vitest";

const cssBeautify = vi.fn();
const cssMinify = vi.fn();
vi.mock("./api", () => ({
  cssBeautify: (...a: unknown[]) => cssBeautify(...a),
  cssMinify: (...a: unknown[]) => cssMinify(...a),
}));

import { runCss } from "./run";

describe("runCss", () => {
  beforeEach(() => {
    cssBeautify.mockReset();
    cssMinify.mockReset();
  });

  it("returns null for blank input", () => {
    expect(runCss("  ", "css", "beautify")).toBeNull();
  });

  it("beautifies and minifies with the chosen syntax", () => {
    cssBeautify.mockReturnValue(Promise.resolve(""));
    runCss("a{}", "scss", "beautify");
    expect(cssBeautify).toHaveBeenCalledWith("a{}", "scss");

    cssMinify.mockReturnValue(Promise.resolve(""));
    runCss("a{}", "css", "minify");
    expect(cssMinify).toHaveBeenCalledWith("a{}", "css");
  });
});
