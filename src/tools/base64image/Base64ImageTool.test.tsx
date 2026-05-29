import { describe, it, expect } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Base64ImageTool } from "./Base64ImageTool";

describe("Base64ImageTool", () => {
  it("offers an image upload in encode mode", () => {
    render(<Base64ImageTool />);
    expect(screen.getByLabelText("Image file")).toBeInTheDocument();
  });

  it("encodes an uploaded file to a data URI", async () => {
    const user = userEvent.setup();
    render(<Base64ImageTool />);
    const file = new File(["hello"], "pic.png", { type: "image/png" });
    await user.upload(screen.getByLabelText("Image file"), file);
    await waitFor(() =>
      expect(
        (screen.getByLabelText("Base64 data URI") as HTMLTextAreaElement).value,
      ).toContain("data:"),
    );
  });

  it("switches to a data-URI preview in decode mode", async () => {
    const user = userEvent.setup();
    render(<Base64ImageTool />);
    await user.click(screen.getByRole("radio", { name: "Base64 → Image" }));
    expect(screen.getByLabelText("Data URI")).toBeInTheDocument();
  });
});
