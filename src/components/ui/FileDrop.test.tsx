import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FileDrop } from "./FileDrop";

function img(name = "shot.png"): File {
  return new File(["data"], name, { type: "image/png" });
}

describe("FileDrop", () => {
  let onFile: Mock<(file: File) => void>;
  beforeEach(() => {
    onFile = vi.fn<(file: File) => void>();
  });

  it("accepts a browsed file via the labelled input", async () => {
    const user = userEvent.setup();
    render(<FileDrop onFile={onFile} inputLabel="Image file" accept="image/*" />);
    await user.upload(screen.getByLabelText("Image file"), img());
    expect(onFile).toHaveBeenCalledTimes(1);
    expect(onFile.mock.calls[0][0].name).toBe("shot.png");
  });

  it("accepts a dropped file", () => {
    render(<FileDrop onFile={onFile} inputLabel="Image file" accept="image/*" />);
    fireEvent.drop(screen.getByRole("button"), {
      dataTransfer: { files: [img("dropped.png")] },
    });
    expect(onFile).toHaveBeenCalledTimes(1);
    expect(onFile.mock.calls[0][0].name).toBe("dropped.png");
  });

  it("ignores a dropped file that doesn't match accept", () => {
    render(<FileDrop onFile={onFile} inputLabel="Image file" accept="image/*" />);
    fireEvent.drop(screen.getByRole("button"), {
      dataTransfer: { files: [new File(["x"], "a.pdf", { type: "application/pdf" })] },
    });
    expect(onFile).not.toHaveBeenCalled();
  });

  it("accepts an image pasted from the clipboard", async () => {
    const file = img("pasted.png");
    render(<FileDrop onFile={onFile} inputLabel="Image file" accept="image/*" />);
    fireEvent.paste(document.body, {
      clipboardData: {
        items: [{ kind: "file", getAsFile: () => file }],
        files: [file],
      },
    });
    await waitFor(() => expect(onFile).toHaveBeenCalledTimes(1));
    expect(onFile.mock.calls[0][0].name).toBe("pasted.png");
  });

  it("leaves a text-only paste alone (no error, no handler call)", () => {
    render(
      <FileDrop
        onFile={onFile}
        inputLabel="Image file"
        accept="image/*"
        typeErrorMessage="not an image"
      />,
    );
    fireEvent.paste(document.body, {
      clipboardData: { items: [{ kind: "string", getAsFile: () => null }], files: [] },
    });
    expect(onFile).not.toHaveBeenCalled();
    expect(screen.queryByText("not an image")).not.toBeInTheDocument();
  });

  it("shows an error when a pasted file isn't an accepted type", () => {
    const pdf = new File(["x"], "doc.pdf", { type: "application/pdf" });
    render(
      <FileDrop
        onFile={onFile}
        inputLabel="Image file"
        accept="image/*"
        typeErrorMessage="That isn't an image."
      />,
    );
    fireEvent.paste(document.body, {
      clipboardData: { items: [{ kind: "file", getAsFile: () => pdf }], files: [pdf] },
    });
    expect(onFile).not.toHaveBeenCalled();
    expect(screen.getByText("That isn't an image.")).toBeInTheDocument();
  });

  it("shows a spinner while onFile is processing, then hides it", async () => {
    let resolveFile!: () => void;
    onFile.mockImplementation(() => new Promise<void>((r) => (resolveFile = r)));
    render(<FileDrop onFile={onFile} inputLabel="Image file" accept="image/*" />);

    fireEvent.drop(screen.getByRole("button"), {
      dataTransfer: { files: [img()] },
    });

    await waitFor(() => expect(screen.getByText("Processing…")).toBeInTheDocument());
    resolveFile();
    await waitFor(() =>
      expect(screen.queryByText("Processing…")).not.toBeInTheDocument(),
    );
  });

  it("renders an image preview when previewUrl is set", () => {
    render(
      <FileDrop
        onFile={onFile}
        inputLabel="Image file"
        accept="image/*"
        previewUrl="data:image/png;base64,AAAA"
      />,
    );
    const preview = screen.getByAltText("Selected file preview") as HTMLImageElement;
    expect(preview.src).toBe("data:image/png;base64,AAAA");
    // The input stays present so the image can be replaced.
    expect(screen.getByLabelText("Image file")).toBeInTheDocument();
  });

  it("shows a Clear button that resets without opening the picker", async () => {
    const user = userEvent.setup();
    const onClear = vi.fn();
    render(
      <FileDrop
        onFile={onFile}
        onClear={onClear}
        inputLabel="Image file"
        accept="image/*"
        previewUrl="data:image/png;base64,AAAA"
      />,
    );
    await user.click(screen.getByRole("button", { name: "Clear" }));
    expect(onClear).toHaveBeenCalledTimes(1);
    // Clearing must not also trigger a file selection.
    expect(onFile).not.toHaveBeenCalled();
  });

  it("hides the Clear button when there is no preview or no handler", () => {
    const { rerender } = render(
      <FileDrop onFile={onFile} inputLabel="Image file" previewUrl="data:image/png;base64,AAAA" />,
    );
    expect(screen.queryByRole("button", { name: "Clear" })).not.toBeInTheDocument();
    rerender(<FileDrop onFile={onFile} onClear={vi.fn()} inputLabel="Image file" />);
    expect(screen.queryByRole("button", { name: "Clear" })).not.toBeInTheDocument();
  });

  it("does not listen for paste when pasteEnabled is false", () => {
    const file = img();
    render(
      <FileDrop onFile={onFile} inputLabel="Image file" accept="image/*" pasteEnabled={false} />,
    );
    fireEvent.paste(document.body, {
      clipboardData: { items: [{ kind: "file", getAsFile: () => file }], files: [file] },
    });
    expect(onFile).not.toHaveBeenCalled();
  });
});
