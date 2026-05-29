import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

const invokeSpy = vi.fn();
let invokeImpl: (cmd: string, payload: { action: string }) => Promise<unknown> =
  () => Promise.resolve(null);
vi.mock("@tauri-apps/api/core", () => ({
  invoke: (cmd: string, payload: { action: string }) => {
    invokeSpy(cmd, payload);
    return invokeImpl(cmd, payload);
  },
}));

import { UuidTool } from "./UuidTool";

beforeEach(() => {
  invokeSpy.mockReset();
  invokeImpl = (_cmd, payload) => {
    if (payload.action === "id.generate") {
      return Promise.resolve(["11111111-1111-4111-8111-111111111111"]);
    }
    if (payload.action === "id.inspect") {
      return Promise.resolve({ kind: "UUID", detail: "version 4" });
    }
    return Promise.resolve(null);
  };
});

describe("UuidTool", () => {
  it("generates ids on mount", async () => {
    render(<UuidTool />);
    expect(
      await screen.findByText("11111111-1111-4111-8111-111111111111"),
    ).toBeInTheDocument();
    expect(invokeSpy).toHaveBeenCalledWith(
      "run_action",
      expect.objectContaining({ action: "id.generate" }),
    );
  });

  it("inspects a pasted id", async () => {
    render(<UuidTool />);
    fireEvent.change(screen.getByLabelText("ID to inspect"), {
      target: { value: "11111111-1111-4111-8111-111111111111" },
    });
    expect(await screen.findByText("version 4")).toBeInTheDocument();
  });
});
