import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// See ipc.test.ts: return rejections from a plain impl, not the spy, so Vitest
// doesn't flag the spy's tracked result as an unhandled rejection.
const invokeSpy = vi.fn();
let invokeImpl: (...args: unknown[]) => Promise<unknown> = () =>
  Promise.resolve("");

vi.mock("@tauri-apps/api/core", () => ({
  invoke: (...args: unknown[]) => {
    invokeSpy(...args);
    return invokeImpl(...args);
  },
}));

// CodeMirror is hard to drive in jsdom; swap it for a plain textarea so we can
// exercise the real data flow (input -> useLiveAction -> runJson -> IPC -> output).
vi.mock("../../components/ui/CodeEditor", () => ({
  CodeEditor: ({
    value,
    onChange,
    ariaLabel,
    readOnly,
  }: {
    value: string;
    onChange?: (value: string) => void;
    ariaLabel?: string;
    readOnly?: boolean;
  }) => (
    <textarea
      aria-label={ariaLabel}
      readOnly={readOnly}
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
    />
  ),
}));

import { JsonTool } from "./JsonTool";

beforeEach(() => {
  invokeSpy.mockReset();
  invokeImpl = () => Promise.resolve("");
});

describe("JsonTool", () => {
  it("renders the output-mode controls", () => {
    render(<JsonTool />);
    expect(screen.getByRole("radio", { name: "2 spaces" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Minify" })).toBeInTheDocument();
  });

  it("switches the active output mode", async () => {
    const user = userEvent.setup();
    render(<JsonTool />);
    const minify = screen.getByRole("radio", { name: "Minify" });
    expect(minify).toHaveAttribute("aria-checked", "false");
    await user.click(minify);
    expect(minify).toHaveAttribute("aria-checked", "true");
  });

  it("formats input through the backend and shows the result", async () => {
    invokeImpl = () => Promise.resolve('{\n  "a": 1\n}');
    render(<JsonTool />);

    fireEvent.change(screen.getByLabelText("JSON input"), {
      target: { value: '{"a":1}' },
    });

    const output = screen.getByLabelText("JSON output") as HTMLTextAreaElement;
    await waitFor(() => expect(output.value).toBe('{\n  "a": 1\n}'));
    expect(invokeSpy).toHaveBeenCalledWith(
      "run_action",
      expect.objectContaining({ action: "json.format" }),
    );
  });

  it("filters via JSONPath when a path is entered", async () => {
    invokeImpl = () => Promise.resolve('"red"');
    render(<JsonTool />);

    fireEvent.change(screen.getByLabelText("JSON input"), {
      target: { value: '{"color":"red"}' },
    });
    fireEvent.change(screen.getByLabelText("JSONPath filter"), {
      target: { value: "$.color" },
    });

    await waitFor(() =>
      expect(invokeSpy).toHaveBeenCalledWith(
        "run_action",
        expect.objectContaining({ action: "json.query" }),
      ),
    );
  });

  it("requests sorted keys when the Sort keys toggle is on", async () => {
    const user = userEvent.setup();
    invokeImpl = () => Promise.resolve("{}");
    render(<JsonTool />);

    await user.click(screen.getByRole("button", { name: "Sort keys" }));
    fireEvent.change(screen.getByLabelText("JSON input"), {
      target: { value: '{"b":1,"a":2}' },
    });

    await waitFor(() =>
      expect(invokeSpy).toHaveBeenCalledWith(
        "run_action",
        expect.objectContaining({
          action: "json.format",
          params: expect.objectContaining({ sort: true }),
        }),
      ),
    );
  });

  it("shows an error banner when the backend rejects", async () => {
    invokeImpl = () =>
      Promise.reject({
        kind: "invalid_input",
        message: "expected value at line 1 column 2",
      });
    render(<JsonTool />);

    fireEvent.change(screen.getByLabelText("JSON input"), {
      target: { value: "{bad}" },
    });

    expect(await screen.findByText("Invalid JSON")).toBeInTheDocument();
    expect(
      screen.getByText(/expected value at line 1 column 2/),
    ).toBeInTheDocument();
  });
});
