import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Segmented } from "./Segmented";

const OPTIONS = [
  { value: "a", label: "Alpha" },
  { value: "b", label: "Beta" },
] as const;

describe("Segmented", () => {
  it("renders an option per choice and marks the active one", () => {
    render(
      <Segmented options={OPTIONS} value="a" onChange={() => {}} ariaLabel="x" />,
    );
    expect(screen.getByRole("radio", { name: "Alpha" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    expect(screen.getByRole("radio", { name: "Beta" })).toHaveAttribute(
      "aria-checked",
      "false",
    );
  });

  it("calls onChange with the chosen value", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(
      <Segmented options={OPTIONS} value="a" onChange={onChange} ariaLabel="x" />,
    );
    await user.click(screen.getByRole("radio", { name: "Beta" }));
    expect(onChange).toHaveBeenCalledWith("b");
  });
});
