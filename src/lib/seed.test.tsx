import { describe, it, expect, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useSeed } from "./seed";
import { useApp } from "../store/app";

beforeEach(() => {
  useApp.setState({ seed: null });
});

describe("useSeed", () => {
  it("returns an empty seed when there is none", () => {
    const { result } = renderHook(() => useSeed());
    expect(result.current).toEqual({ value: "" });
  });

  it("returns the pending seed and clears it after mount", () => {
    useApp.setState({ seed: { value: "hello", mode: "decode" } });
    const { result } = renderHook(() => useSeed());
    expect(result.current).toEqual({ value: "hello", mode: "decode" });
    expect(useApp.getState().seed).toBeNull();
  });
});
