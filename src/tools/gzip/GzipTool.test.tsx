import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

const invokeSpy = vi.fn();
let invokeImpl: (...a: unknown[]) => Promise<unknown> = () => Promise.resolve("");
vi.mock("@tauri-apps/api/core", () => ({
  invoke: (...a: unknown[]) => {
    invokeSpy(...a);
    return invokeImpl(...a);
  },
}));

vi.mock("../../components/ui/CodeEditor", () => ({
  CodeEditor: ({
    value,
    onChange,
    ariaLabel,
    readOnly,
  }: {
    value: string;
    onChange?: (v: string) => void;
    ariaLabel?: string;
    readOnly?: boolean;
  }) => (
    <textarea
      aria-label={ariaLabel}
      value={value}
      readOnly={readOnly}
      onChange={(e) => onChange?.(e.target.value)}
    />
  ),
}));

import { GzipTool } from "./GzipTool";

beforeEach(() => {
  invokeSpy.mockReset();
  invokeImpl = () => Promise.resolve("");
});

describe("GzipTool", () => {
  it("compresses text via the backend", async () => {
    invokeImpl = () => Promise.resolve("H4sIAAAA");
    render(<GzipTool />);
    fireEvent.change(screen.getByLabelText("Gzip input"), {
      target: { value: "hello" },
    });
    await waitFor(() =>
      expect(invokeSpy).toHaveBeenCalledWith(
        "run_action",
        expect.objectContaining({ action: "gzip.compress" }),
      ),
    );
    await waitFor(() =>
      expect(screen.getByLabelText("Gzip output")).toHaveValue("H4sIAAAA"),
    );
  });

  it("decompresses base64 gzip via the backend", async () => {
    invokeImpl = () => Promise.resolve("hello");
    render(<GzipTool />);
    fireEvent.click(screen.getByRole("radio", { name: "Decompress" }));
    fireEvent.change(screen.getByLabelText("Gzip input"), {
      target: { value: "H4sIAAAA" },
    });
    await waitFor(() =>
      expect(invokeSpy).toHaveBeenCalledWith(
        "run_action",
        expect.objectContaining({ action: "gzip.decompress" }),
      ),
    );
    await waitFor(() =>
      expect(screen.getByLabelText("Gzip output")).toHaveValue("hello"),
    );
  });
});
