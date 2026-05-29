import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Sidebar } from "./Sidebar";
import { useApp } from "../../store/app";
import { DEFAULT_TOOL_ID } from "../../tools/registry";

describe("Sidebar", () => {
  beforeEach(() => {
    useApp.setState({ activeToolId: DEFAULT_TOOL_ID, paletteOpen: false });
  });

  it("renders category headings and tools", () => {
    render(<Sidebar />);
    expect(screen.getByText("Formatters")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /JSON Format/ })).toBeInTheDocument();
  });

  it("selects a tool on click", async () => {
    const user = userEvent.setup();
    render(<Sidebar />);
    await user.click(screen.getByRole("button", { name: /Base64 String/ }));
    expect(useApp.getState().activeToolId).toBe("base64-string");
  });

  it("filters tools by query", async () => {
    const user = userEvent.setup();
    render(<Sidebar />);
    await user.type(screen.getByPlaceholderText("Filter tools…"), "uuid");
    expect(screen.getByRole("button", { name: /UUID/ })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /JSON Format/ }),
    ).not.toBeInTheDocument();
  });

  it("shows an empty state when nothing matches", async () => {
    const user = userEvent.setup();
    render(<Sidebar />);
    await user.type(screen.getByPlaceholderText("Filter tools…"), "zzzzz");
    expect(screen.getByText(/No tools match/)).toBeInTheDocument();
  });
});
