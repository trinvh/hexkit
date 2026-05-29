import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { tokenizeJson, JsonView } from "./JsonView";

describe("tokenizeJson", () => {
  it("classifies keys, string values, numbers, and punctuation", () => {
    const tokens = tokenizeJson('{"a":1,"b":"x"}');
    const find = (text: string) => tokens.find((t) => t.text === text);
    expect(find('"a"')?.kind).toBe("key");
    expect(find('"b"')?.kind).toBe("key");
    expect(find('"x"')?.kind).toBe("string");
    expect(find("1")?.kind).toBe("number");
    expect(find("{")?.kind).toBe("punct");
    expect(find(":")?.kind).toBe("punct");
  });

  it("classifies booleans and null as keywords", () => {
    const tokens = tokenizeJson('{"a":true,"b":null,"c":false}');
    expect(tokens.find((t) => t.text === "true")?.kind).toBe("keyword");
    expect(tokens.find((t) => t.text === "null")?.kind).toBe("keyword");
    expect(tokens.find((t) => t.text === "false")?.kind).toBe("keyword");
  });

  it("handles decimals and exponents", () => {
    const tokens = tokenizeJson('{"n":-1.5e3}');
    expect(tokens.find((t) => t.text === "-1.5e3")?.kind).toBe("number");
  });

  it("preserves the exact text (round-trips by concatenation)", () => {
    const input = '{\n  "a": [1, 2],\n  "b": "hi"\n}';
    expect(tokenizeJson(input).map((t) => t.text).join("")).toBe(input);
  });

  it("does not misclassify a string value that precedes a brace", () => {
    const tokens = tokenizeJson('{"k":"v"}');
    expect(tokens.find((t) => t.text === '"v"')?.kind).toBe("string");
  });
});

describe("JsonView", () => {
  it("renders the JSON text", () => {
    render(<JsonView value='{"name":"hexkit"}' ariaLabel="payload" />);
    const el = screen.getByLabelText("payload");
    expect(el.textContent).toBe('{"name":"hexkit"}');
  });
});
