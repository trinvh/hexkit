import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, fireEvent } from "@testing-library/react";

vi.mock("./components/ui/CodeEditor", () => ({
  CodeEditor: () => <div data-testid="code-editor" />,
}));

import App from "./App";
import { useApp } from "./store/app";

describe("App", () => {
  beforeEach(() => {
    useApp.setState({ activeToolId: "json-format", paletteOpen: false });
  });

  it("opens the command palette on Cmd/Ctrl+K", () => {
    render(<App />);
    expect(useApp.getState().paletteOpen).toBe(false);
    fireEvent.keyDown(window, { key: "k", metaKey: true });
    expect(useApp.getState().paletteOpen).toBe(true);
  });

  it("toggles the palette closed on a second press", () => {
    render(<App />);
    fireEvent.keyDown(window, { key: "k", ctrlKey: true });
    fireEvent.keyDown(window, { key: "k", ctrlKey: true });
    expect(useApp.getState().paletteOpen).toBe(false);
  });
});
