import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

const invokeSpy = vi.fn();
let invokeImpl: (...args: unknown[]) => Promise<unknown> = () =>
  Promise.resolve(null);
vi.mock("@tauri-apps/api/core", () => ({
  invoke: (...args: unknown[]) => {
    invokeSpy(...args);
    return invokeImpl(...args);
  },
}));

import { UrlParseTool } from "./UrlParseTool";

beforeEach(() => {
  invokeSpy.mockReset();
  invokeImpl = () => Promise.resolve(null);
});

describe("UrlParseTool", () => {
  it("breaks a url into labelled parts", async () => {
    invokeImpl = () =>
      Promise.resolve({
        scheme: "https",
        username: "",
        password: "",
        host: "example.com",
        port: "8080",
        path: "/p",
        query: "x=1",
        fragment: "",
        query_params: [{ key: "x", value: "1" }],
      });
    render(<UrlParseTool />);
    fireEvent.change(screen.getByLabelText("URL to parse"), {
      target: { value: "https://example.com:8080/p?x=1" },
    });
    expect(await screen.findByText("example.com")).toBeInTheDocument();
    expect(screen.getByText("8080")).toBeInTheDocument();
    expect(screen.getByText("?x")).toBeInTheDocument();
    expect(invokeSpy).toHaveBeenCalledWith(
      "run_action",
      expect.objectContaining({ action: "url.parse" }),
    );
  });

  it("shows an error for an invalid url", async () => {
    invokeImpl = () =>
      Promise.reject({ kind: "invalid_input", message: "relative URL without a base" });
    render(<UrlParseTool />);
    fireEvent.change(screen.getByLabelText("URL to parse"), {
      target: { value: "not a url" },
    });
    expect(await screen.findByText("Invalid URL")).toBeInTheDocument();
  });
});
