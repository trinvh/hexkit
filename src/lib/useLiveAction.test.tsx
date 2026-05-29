import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useLiveAction } from "./useLiveAction";

describe("useLiveAction", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("waits for the debounce delay before computing", async () => {
    const compute = vi.fn(() => Promise.resolve("done"));
    const { result } = renderHook(() => useLiveAction(compute, ["a"], 120));

    expect(compute).not.toHaveBeenCalled();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(120);
    });
    expect(compute).toHaveBeenCalledTimes(1);
    expect(result.current.data).toBe("done");
    expect(result.current.error).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it("clears state when compute returns null", async () => {
    const compute = vi.fn(() => null);
    const { result } = renderHook(() => useLiveAction(compute, ["x"], 50));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(50);
    });
    expect(result.current).toEqual({ data: null, error: null, loading: false });
  });

  it("surfaces the message from a rejected ToolError", async () => {
    const compute = vi.fn(() =>
      Promise.reject({ kind: "invalid_input", message: "bad json" }),
    );
    const { result } = renderHook(() => useLiveAction(compute, ["x"], 50));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(50);
    });
    expect(result.current.error).toBe("bad json");
    expect(result.current.data).toBeNull();
  });

  it("ignores results from superseded runs", async () => {
    const resolvers: Array<(value: string) => void> = [];
    const compute = vi.fn(
      () => new Promise<string>((resolve) => resolvers.push(resolve)),
    );
    const { result, rerender } = renderHook(
      ({ dep }) => useLiveAction(compute, [dep], 100),
      { initialProps: { dep: "1" } },
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    }); // run #1 started
    rerender({ dep: "2" });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    }); // run #2 started

    expect(compute).toHaveBeenCalledTimes(2);

    // Resolve the current run, then the stale one — the stale result must lose.
    await act(async () => {
      resolvers[1]("second");
    });
    await act(async () => {
      resolvers[0]("first");
    });

    expect(result.current.data).toBe("second");
  });
});
