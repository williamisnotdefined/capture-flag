import { describe, expect, it } from "vitest";
import { isFiniteNumber } from "../isFiniteNumber";

describe("isFiniteNumber", () => {
  it("accepts finite numbers", () => {
    expect(isFiniteNumber(10)).toBe(true);
  });

  it("rejects non-finite numbers and non-number values", () => {
    expect(isFiniteNumber(Number.NaN)).toBe(false);
    expect(isFiniteNumber(Number.POSITIVE_INFINITY)).toBe(false);
    expect(isFiniteNumber("10")).toBe(false);
  });
});
