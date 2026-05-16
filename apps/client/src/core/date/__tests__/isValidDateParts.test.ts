import { isValidDateParts } from "@core/date/isValidDateParts";
import { describe, expect, it } from "vitest";

describe("isValidDateParts", () => {
  it("validates calendar date parts", () => {
    expect(isValidDateParts("2024", "02", "29")).toBe(true);
    expect(isValidDateParts("2026", "02", "29")).toBe(false);
    expect(isValidDateParts("2026", "00", "01")).toBe(false);
    expect(isValidDateParts("2026", "13", "01")).toBe(false);
    expect(isValidDateParts("2026", "05", "00")).toBe(false);
  });
});
