import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const invokeSpy = vi.fn();
let invokeImpl: (cmd: string, payload: unknown) => Promise<unknown> = () =>
  Promise.resolve("");
vi.mock("@tauri-apps/api/core", () => ({
  invoke: (cmd: string, payload: unknown) => {
    invokeSpy(cmd, payload);
    return invokeImpl(cmd, payload);
  },
}));

// Render CodeMirror as a plain textarea so the body editor is testable.
vi.mock("../../components/ui/CodeEditor", () => ({
  CodeEditor: ({
    value,
    onChange,
    ariaLabel,
  }: {
    value: string;
    onChange?: (v: string) => void;
    ariaLabel?: string;
  }) => (
    <textarea
      aria-label={ariaLabel}
      value={value}
      onChange={(e) => onChange?.(e.currentTarget.value)}
    />
  ),
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import { HttpClientTool } from "./HttpClientTool";

function action(payload: unknown): string | undefined {
  return (payload as { action?: string } | undefined)?.action;
}

beforeEach(() => {
  invokeSpy.mockReset();
  invokeImpl = () => Promise.resolve("");
});

describe("HttpClientTool", () => {
  it("shows the networked badge and the URL field", () => {
    render(<HttpClientTool />);
    expect(screen.getByText("Online")).toBeInTheDocument();
    expect(screen.getByLabelText("Request URL")).toBeInTheDocument();
  });

  it("sends the request via the http_send command", async () => {
    invokeImpl = (cmd) =>
      cmd === "http_send"
        ? Promise.resolve({
            status: 200,
            statusText: "OK",
            headers: [["content-type", "application/json"]],
            body: '{"ok":true}',
            bodyBase64: false,
            truncated: false,
            elapsedMs: 12,
            sizeBytes: 11,
          })
        : Promise.resolve("");
    const user = userEvent.setup();
    render(<HttpClientTool />);

    await user.type(screen.getByLabelText("Request URL"), "https://api.example.com");
    await user.click(screen.getByRole("button", { name: /send/i }));

    await waitFor(() =>
      expect(invokeSpy).toHaveBeenCalledWith(
        "http_send",
        expect.objectContaining({
          request: expect.objectContaining({ url: "https://api.example.com", method: "GET" }),
        }),
      ),
    );
    // The response status renders.
    await waitFor(() => expect(screen.getByText(/200 OK/)).toBeInTheDocument());
  });

  it("imports a curl command and populates the URL", async () => {
    invokeImpl = (_cmd, payload) =>
      action(payload) === "httpreq.from_curl"
        ? Promise.resolve({
            method: "POST",
            url: "https://imported.example.com",
            query: [],
            headers: [],
            body: { type: "none" },
          })
        : Promise.resolve("");
    const user = userEvent.setup();
    render(<HttpClientTool />);

    await user.click(screen.getByRole("button", { name: "Import cURL" }));
    await user.type(
      screen.getByLabelText("cURL command to import"),
      "curl -X POST https://imported.example.com",
    );
    await user.click(screen.getByRole("button", { name: "Import" }));

    await waitFor(() =>
      expect(screen.getByLabelText("Request URL")).toHaveValue("https://imported.example.com"),
    );
    expect(invokeSpy).toHaveBeenCalledWith(
      "run_action",
      expect.objectContaining({ action: "httpreq.from_curl" }),
    );
  });

  it("shows a spinner while the import is in flight", async () => {
    let resolveImport!: (req: unknown) => void;
    invokeImpl = () => new Promise((resolve) => (resolveImport = resolve));
    const user = userEvent.setup();
    render(<HttpClientTool />);

    await user.click(screen.getByRole("button", { name: "Import cURL" }));
    await user.type(screen.getByLabelText("cURL command to import"), "curl https://x.com");
    await user.click(screen.getByRole("button", { name: "Import" }));

    // While the backend call is pending, the button reflects the in-flight state.
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /importing/i })).toBeDisabled(),
    );

    resolveImport({
      method: "GET",
      url: "https://x.com",
      query: [],
      headers: [],
      body: { type: "none" },
    });
    await waitFor(() =>
      expect(screen.queryByRole("button", { name: /importing/i })).not.toBeInTheDocument(),
    );
  });
});
