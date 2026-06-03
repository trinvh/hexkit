import { describe, it, expect } from "vitest";
import {
  activeCount,
  addRow,
  buildBody,
  buildRequest,
  formatBytes,
  languageForContentType,
  prettyJson,
  removeRow,
  statusClass,
  updateRow,
} from "./run";
import type { Param } from "./types";

const rows: Param[] = [
  { key: "a", value: "1", enabled: true },
  { key: "b", value: "2", enabled: false },
];

describe("row helpers", () => {
  it("updates a row immutably", () => {
    const next = updateRow(rows, 0, { value: "9" });
    expect(next[0].value).toBe("9");
    expect(rows[0].value).toBe("1"); // original untouched
  });

  it("removes a row", () => {
    expect(removeRow(rows, 0)).toEqual([rows[1]]);
  });

  it("appends an empty row", () => {
    const next = addRow(rows);
    expect(next).toHaveLength(3);
    expect(next[2]).toEqual({ key: "", value: "", enabled: true });
  });

  it("counts only enabled non-empty rows", () => {
    expect(activeCount(rows)).toBe(1);
    expect(activeCount([{ key: "", value: "x", enabled: true }])).toBe(0);
  });
});

describe("buildBody", () => {
  it("returns none", () => {
    expect(buildBody("none", "x", "y", [], [])).toEqual({ type: "none" });
  });

  it("returns raw with content type", () => {
    expect(buildBody("raw", "{}", "application/json", [], [])).toEqual({
      type: "raw",
      content: "{}",
      contentType: "application/json",
    });
  });

  it("returns form fields", () => {
    expect(buildBody("form", "", "", rows, [])).toEqual({ type: "form", fields: rows });
  });

  it("returns multipart fields", () => {
    expect(buildBody("multipart", "", "", [], rows)).toEqual({
      type: "multipart",
      fields: rows,
    });
  });
});

describe("buildRequest", () => {
  it("trims the url and carries the parts", () => {
    const req = buildRequest({
      method: "POST",
      url: "  https://x.com  ",
      query: [],
      headers: rows,
      body: { type: "none" },
    });
    expect(req.url).toBe("https://x.com");
    expect(req.method).toBe("POST");
    expect(req.headers).toBe(rows);
  });
});

describe("display helpers", () => {
  it("classifies status colours", () => {
    expect(statusClass(200)).toContain("emerald");
    expect(statusClass(301)).toContain("amber");
    expect(statusClass(404)).toContain("accent");
  });

  it("formats bytes", () => {
    expect(formatBytes(512)).toBe("512 B");
    expect(formatBytes(2048)).toBe("2.0 KB");
    expect(formatBytes(5 * 1024 * 1024)).toBe("5.00 MB");
  });

  it("pretty-prints valid json and passes through invalid", () => {
    expect(prettyJson('{"a":1}')).toBe('{\n  "a": 1\n}');
    expect(prettyJson("not json")).toBe("not json");
  });

  it("maps content types to languages", () => {
    expect(languageForContentType("application/json; charset=utf-8")).toBe("json");
    expect(languageForContentType("text/html")).toBe("html");
    expect(languageForContentType("application/octet-stream")).toBeUndefined();
    expect(languageForContentType(undefined)).toBeUndefined();
  });
});
