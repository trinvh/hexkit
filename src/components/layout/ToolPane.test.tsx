import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { useApp } from "../../store/app";
import { TOOLS } from "../../tools/registry";

vi.mock("../ui/CodeEditor", () => ({
  CodeEditor: ({ ariaLabel }: { ariaLabel?: string }) => (
    <div data-testid="code-editor" aria-label={ariaLabel} />
  ),
}));

import { ToolPane } from "./ToolPane";

describe("ToolPane", () => {
  it("shows the scaffolded placeholder for tools without a component", () => {
    const scaffolded = TOOLS.find((tool) => !tool.component);
    if (!scaffolded) return; // all tools implemented — branch no longer reachable
    useApp.setState({ activeToolId: scaffolded.id });
    render(<ToolPane />);
    expect(screen.getByText(scaffolded.name)).toBeInTheDocument();
    expect(screen.getByText(/Wired up in the next phase/)).toBeInTheDocument();
  });

  it("renders the tool component when one is wired", async () => {
    useApp.setState({ activeToolId: "json-format" });
    render(<ToolPane />);
    // Tool components are lazy-loaded, so wait for the chunk to resolve.
    expect(
      await screen.findByRole("radio", { name: "2 spaces" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/Wired up in the next phase/),
    ).not.toBeInTheDocument();
  });
});
