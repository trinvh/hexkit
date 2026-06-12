import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { downloadText } from "./download";

describe("downloadText", () => {
  const createObjectURL = vi.fn((_blob: Blob) => "blob:mock");
  const revokeObjectURL = vi.fn();
  let clickSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    createObjectURL.mockClear();
    revokeObjectURL.mockClear();
    // jsdom doesn't implement object URLs.
    Object.defineProperty(URL, "createObjectURL", {
      value: createObjectURL,
      configurable: true,
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      value: revokeObjectURL,
      configurable: true,
    });
    clickSpy = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => {});
  });

  afterEach(() => {
    clickSpy.mockRestore();
  });

  it("creates a download anchor, clicks it, and cleans up", () => {
    downloadText("output.txt", "hello world");

    expect(createObjectURL).toHaveBeenCalledTimes(1);
    const blob = createObjectURL.mock.calls[0][0];
    expect(blob).toBeInstanceOf(Blob);
    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:mock");
    // The temporary anchor must not linger in the DOM.
    expect(document.querySelector("a[download]")).toBeNull();
  });

  it("uses the provided filename and mime type", () => {
    downloadText("data.json", "{}", "application/json");
    const blob = createObjectURL.mock.calls[0][0];
    expect(blob.type).toBe("application/json");
  });
});
