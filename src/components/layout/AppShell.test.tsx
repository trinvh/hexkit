import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { useApp } from "../../store/app";

vi.mock("../ui/CodeEditor", () => ({
  CodeEditor: () => <div data-testid="code-editor" />,
}));

import { AppShell } from "./AppShell";

describe("AppShell", () => {
  beforeEach(() => {
    useApp.setState({ activeToolId: "json-format", paletteOpen: false });
  });

  it("composes the brand, sidebar, and active tool", () => {
    render(<AppShell />);
    expect(screen.getByText("Hexkit")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "JSON Format / Validate" }),
    ).toBeInTheDocument();
  });
});
