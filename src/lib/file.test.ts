import { describe, it, expect } from "vitest";
import { fileMatchesAccept, pickAcceptedFile } from "./file";

function f(name: string, type: string): File {
  return new File(["x"], name, { type });
}

describe("fileMatchesAccept", () => {
  it("matches everything when accept is empty", () => {
    expect(fileMatchesAccept(f("a.bin", "application/octet-stream"))).toBe(true);
    expect(fileMatchesAccept(f("a.bin", ""), "")).toBe(true);
  });

  it("matches a wildcard MIME group", () => {
    expect(fileMatchesAccept(f("shot.png", "image/png"), "image/*")).toBe(true);
    expect(fileMatchesAccept(f("doc.pdf", "application/pdf"), "image/*")).toBe(false);
  });

  it("matches an exact MIME type", () => {
    expect(fileMatchesAccept(f("d.json", "application/json"), "application/json")).toBe(true);
  });

  it("matches by extension", () => {
    expect(fileMatchesAccept(f("photo.JPG", "image/jpeg"), ".jpg,.png")).toBe(true);
    expect(fileMatchesAccept(f("photo.gif", "image/gif"), ".jpg,.png")).toBe(false);
  });
});

describe("pickAcceptedFile", () => {
  it("returns the first matching file", () => {
    const files = [f("a.txt", "text/plain"), f("b.png", "image/png")];
    expect(pickAcceptedFile(files, "image/*")?.name).toBe("b.png");
  });

  it("returns null when nothing matches", () => {
    expect(pickAcceptedFile([f("a.txt", "text/plain")], "image/*")).toBeNull();
  });
});
