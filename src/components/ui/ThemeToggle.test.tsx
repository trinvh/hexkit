import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeToggle } from "./ThemeToggle";
import { useTheme } from "../../lib/theme";

describe("ThemeToggle", () => {
  beforeEach(() => {
    useTheme.getState().setMode("system");
  });

  it("labels the button with the current mode", () => {
    render(<ThemeToggle />);
    expect(
      screen.getByRole("button", { name: /system theme/i }),
    ).toBeInTheDocument();
  });

  it("cycles the mode on click", async () => {
    const user = userEvent.setup();
    render(<ThemeToggle />);
    await user.click(screen.getByRole("button"));
    expect(useTheme.getState().mode).toBe("light");
    await user.click(screen.getByRole("button"));
    expect(useTheme.getState().mode).toBe("dark");
  });
});
