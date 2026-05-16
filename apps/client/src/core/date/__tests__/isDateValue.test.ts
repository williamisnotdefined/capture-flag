import { describe, expect, it } from "vitest";
import { isDateValue } from "../isDateValue";

describe("isDateValue", () => {
  it("accepts finite timestamps and valid ISO dates", () => {
    expect(isDateValue(0)).toBe(true);
    expect(isDateValue("2026-05-12")).toBe(true);
    expect(isDateValue("2026-05-12T10:30:59.000Z")).toBe(true);
  });

  it("rejects invalid date values", () => {
    expect(isDateValue(Number.POSITIVE_INFINITY)).toBe(false);
    expect(isDateValue(" 2026-05-12")).toBe(false);
    expect(isDateValue({ value: "2026-05-12" })).toBe(false);
  });
});
