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

import { CaseTool } from "./CaseTool";

beforeEach(() => {
  invokeSpy.mockReset();
  invokeImpl = () => Promise.resolve(null);
});

describe("CaseTool", () => {
  it("renders every case variant for the input", async () => {
    invokeImpl = () =>
      Promise.resolve({
        camel: "helloWorld",
        pascal: "HelloWorld",
        snake: "hello_world",
        kebab: "hello-world",
        constant: "HELLO_WORLD",
        title: "Hello World",
        sentence: "Hello world",
        lower: "hello world",
        upper: "HELLO WORLD",
      });
    render(<CaseTool />);
    fireEvent.change(screen.getByLabelText("Text to convert"), {
      target: { value: "hello world" },
    });
    expect(await screen.findByText("helloWorld")).toBeInTheDocument();
    expect(screen.getByText("HELLO_WORLD")).toBeInTheDocument();
    expect(invokeSpy).toHaveBeenCalledWith(
      "run_action",
      expect.objectContaining({ action: "case.convert" }),
    );
  });
});
