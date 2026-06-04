import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

const invokeSpy = vi.fn();
let invokeImpl: (...args: unknown[]) => Promise<unknown> = () =>
  Promise.resolve("");
vi.mock("@tauri-apps/api/core", () => ({
  invoke: (...args: unknown[]) => {
    invokeSpy(...args);
    return invokeImpl(...args);
  },
}));
vi.mock("../../components/ui/CodeEditor", () => ({
  CodeEditor: ({
    value,
    onChange,
    ariaLabel,
    readOnly,
  }: {
    value: string;
    onChange?: (v: string) => void;
    ariaLabel?: string;
    readOnly?: boolean;
  }) => (
    <textarea
      aria-label={ariaLabel}
      readOnly={readOnly}
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
    />
  ),
}));

import { DockerComposeTool } from "./DockerComposeTool";

beforeEach(() => {
  invokeSpy.mockReset();
  invokeImpl = () => Promise.resolve("");
});

describe("DockerComposeTool", () => {
  it("converts a docker run command via the backend", async () => {
    const yaml =
      "services:\n  web:\n    image: nginx:latest\n    ports:\n      - \"8080:80\"\n";
    invokeImpl = () => Promise.resolve(yaml);
    render(<DockerComposeTool />);
    fireEvent.change(screen.getByLabelText("docker run command"), {
      target: {
        value:
          "docker run -d --name web -p 8080:80 -e KEY=val -v /data:/var/data --restart unless-stopped nginx:latest",
      },
    });
    const output = screen.getByLabelText(
      "docker-compose YAML",
    ) as HTMLTextAreaElement;
    await waitFor(() => expect(output.value).toBe(yaml));
    expect(invokeSpy).toHaveBeenCalledWith(
      "run_action",
      expect.objectContaining({ action: "dockerc.to_compose" }),
    );
  });
});
