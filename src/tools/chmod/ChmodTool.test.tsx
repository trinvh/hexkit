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

import { ChmodTool } from "./ChmodTool";

beforeEach(() => {
  invokeSpy.mockReset();
  invokeImpl = () => Promise.resolve(null);
});

describe("ChmodTool", () => {
  it("describes an octal mode as symbolic", async () => {
    invokeImpl = () =>
      Promise.resolve({
        octal: "0755",
        symbolic: "rwxr-xr-x",
        owner: { read: true, write: true, execute: true },
        group: { read: true, write: false, execute: true },
        others: { read: true, write: false, execute: true },
        special: { setuid: false, setgid: false, sticky: false },
      });
    render(<ChmodTool />);
    fireEvent.change(screen.getByLabelText("Permission mode"), {
      target: { value: "755" },
    });
    expect(await screen.findByText("rwxr-xr-x")).toBeInTheDocument();
    expect(screen.getByText("0755")).toBeInTheDocument();
    expect(invokeSpy).toHaveBeenCalledWith(
      "run_action",
      expect.objectContaining({ action: "chmod.describe" }),
    );
  });

  it("describes a symbolic mode as octal", async () => {
    invokeImpl = () =>
      Promise.resolve({
        octal: "0644",
        symbolic: "rw-r--r--",
        owner: { read: true, write: true, execute: false },
        group: { read: true, write: false, execute: false },
        others: { read: true, write: false, execute: false },
        special: { setuid: false, setgid: false, sticky: false },
      });
    render(<ChmodTool />);
    fireEvent.change(screen.getByLabelText("Permission mode"), {
      target: { value: "rw-r--r--" },
    });
    expect(await screen.findByText("0644")).toBeInTheDocument();
  });

  it("surfaces special bits", async () => {
    invokeImpl = () =>
      Promise.resolve({
        octal: "07755",
        symbolic: "rwsr-sr-t",
        owner: { read: true, write: true, execute: true },
        group: { read: true, write: false, execute: true },
        others: { read: true, write: false, execute: true },
        special: { setuid: true, setgid: true, sticky: true },
      });
    render(<ChmodTool />);
    fireEvent.change(screen.getByLabelText("Permission mode"), {
      target: { value: "7755" },
    });
    expect(
      await screen.findByText("setuid, setgid, sticky"),
    ).toBeInTheDocument();
  });

  it("shows an error for a malformed mode", async () => {
    invokeImpl = () =>
      Promise.reject({ kind: "invalid_input", message: "invalid octal mode: 999" });
    render(<ChmodTool />);
    fireEvent.change(screen.getByLabelText("Permission mode"), {
      target: { value: "999" },
    });
    expect(await screen.findByText("Invalid mode")).toBeInTheDocument();
  });
});
