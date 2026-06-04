import { describe, it, expect, vi, beforeEach } from "vitest";

const dockerRunToCompose = vi.fn();
vi.mock("./api", () => ({
  dockerRunToCompose: (...a: unknown[]) => dockerRunToCompose(...a),
}));

import { runDockerCompose } from "./run";

describe("runDockerCompose", () => {
  beforeEach(() => {
    dockerRunToCompose.mockReset();
  });

  it("returns null for empty or whitespace input", () => {
    expect(runDockerCompose("")).toBeNull();
    expect(runDockerCompose("   ")).toBeNull();
  });

  it("forwards the command to the backend", () => {
    dockerRunToCompose.mockReturnValue(Promise.resolve("services:\n"));
    runDockerCompose("docker run nginx");
    expect(dockerRunToCompose).toHaveBeenCalledWith("docker run nginx");
  });
});
