import { describe, expect, it } from "vitest";
import { toDate } from "../toDate";

describe("toDate", () => {
  it("returns a Date for valid values", () => {
    expect(toDate("2026-05-12T00:00:00.000Z")?.toISOString()).toBe("2026-05-12T00:00:00.000Z");
  });

  it("returns null for empty or invalid values", () => {
    expect(toDate("")).toBeNull();
    expect(toDate("invalid-date")).toBeNull();
  });
});
