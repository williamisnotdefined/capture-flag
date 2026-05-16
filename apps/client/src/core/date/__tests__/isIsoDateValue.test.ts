import { isIsoDateValue } from "@core/date/isIsoDateValue";
import { describe, expect, it } from "vitest";

describe("isIsoDateValue", () => {
  it("accepts ISO date-only and timezone date-time values", () => {
    expect(isIsoDateValue("2024-02-29")).toBe(true);
    expect(isIsoDateValue("2026-05-12T10:30:59.000Z")).toBe(true);
    expect(isIsoDateValue("2026-05-12T10:30:59-03:00")).toBe(true);
  });

  it("rejects invalid or incomplete ISO date values", () => {
    expect(isIsoDateValue("2026-02-29")).toBe(false);
    expect(isIsoDateValue("2026-05-12T24:00:00Z")).toBe(false);
    expect(isIsoDateValue("2026-05-12T10:30:59")).toBe(false);
  });
});
