import { jsonArrayToInput } from "@core/json/jsonArrayToInput";
import { describe, expect, it } from "vitest";

describe("jsonArrayToInput", () => {
  it("formats arrays for textarea input", () => {
    expect(jsonArrayToInput([{ value: 1 }])).toBe('[\n  {\n    "value": 1\n  }\n]');
  });

  it("falls back to an empty array for non-array values", () => {
    expect(jsonArrayToInput({ value: 1 })).toBe("[]");
  });
});
