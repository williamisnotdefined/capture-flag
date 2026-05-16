import { describe, expect, it } from "vitest";
import { toIsoDateTime } from "../toIsoDateTime";

describe("toIsoDateTime", () => {
  it("returns ISO date-time strings for valid values", () => {
    expect(toIsoDateTime("2026-05-12T00:00:00.000Z")).toBe("2026-05-12T00:00:00.000Z");
  });

  it("returns undefined for invalid values", () => {
    expect(toIsoDateTime("invalid-date")).toBeUndefined();
  });
});
