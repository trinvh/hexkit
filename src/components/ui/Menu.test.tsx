import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Pin } from "lucide-react";
import { Menu } from "./Menu";

describe("Menu", () => {
  it("renders items and fires onSelect, then closes", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const onClose = vi.fn();
    render(
      <Menu
        x={20}
        y={20}
        onClose={onClose}
        items={[{ label: "Pin to top", icon: Pin, onSelect }]}
      />,
    );
    await user.click(screen.getByRole("menuitem", { name: "Pin to top" }));
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("closes on Escape", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <Menu
        x={0}
        y={0}
        onClose={onClose}
        items={[{ label: "Item", onSelect: vi.fn() }]}
      />,
    );
    await user.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalled();
  });

  it("closes when clicking outside", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <div>
        <button type="button">outside</button>
        <Menu
          x={0}
          y={0}
          onClose={onClose}
          items={[{ label: "Item", onSelect: vi.fn() }]}
        />
      </div>,
    );
    await user.click(screen.getByRole("button", { name: "outside" }));
    expect(onClose).toHaveBeenCalled();
  });
});
