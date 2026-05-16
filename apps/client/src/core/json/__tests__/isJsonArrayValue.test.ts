import { describe, expect, it } from "vitest";
import { isJsonArrayValue } from "../isJsonArrayValue";

describe("isJsonArrayValue", () => {
  it("accepts arrays containing only JSON values", () => {
    expect(isJsonArrayValue([1, "two", null, { enabled: true }])).toBe(true);
  });

  it("rejects non-arrays or arrays with invalid JSON values", () => {
    expect(isJsonArrayValue({ value: [] })).toBe(false);
    expect(isJsonArrayValue([Number.POSITIVE_INFINITY])).toBe(false);
  });
});
