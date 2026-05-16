import { isComparableValue } from "@core/validation/isComparableValue";
import { describe, expect, it } from "vitest";

describe("isComparableValue", () => {
  it("accepts comparable primitive values", () => {
    expect(isComparableValue(null)).toBe(true);
    expect(isComparableValue(false)).toBe(true);
    expect(isComparableValue("value")).toBe(true);
    expect(isComparableValue(1)).toBe(true);
  });

  it("rejects non-comparable values", () => {
    expect(isComparableValue(Number.NaN)).toBe(false);
    expect(isComparableValue({ value: 1 })).toBe(false);
  });
});
