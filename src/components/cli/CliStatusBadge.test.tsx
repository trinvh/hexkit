import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CliStatusBadge } from "./CliStatusBadge";

describe("CliStatusBadge", () => {
  it("renders the install copy when the CLI is missing", () => {
    render(<CliStatusBadge state="missing" onClick={() => {}} />);
    expect(screen.getByRole("button", { name: /isn't installed/i })).toBeInTheDocument();
    expect(screen.getByText("Install CLI")).toBeInTheDocument();
  });

  it("renders the update copy when the CLI is outdated", () => {
    render(<CliStatusBadge state="outdated" onClick={() => {}} />);
    expect(screen.getByText("Update CLI")).toBeInTheDocument();
  });

  it("renders the neutral CLI label when up to date", () => {
    render(<CliStatusBadge state="ok" onClick={() => {}} />);
    expect(screen.getByRole("button", { name: /up to date/i })).toBeInTheDocument();
  });

  it("calls onClick when activated", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<CliStatusBadge state="missing" onClick={onClick} />);
    await user.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
