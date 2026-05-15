import { describe, expect, it } from "vitest";
import { parseSegmentConditions } from "./SegmentsPanel";

describe("segment condition parsing", () => {
  it("rejects attributes longer than the API limit", () => {
    const conditions = JSON.stringify([
      { attribute: "a".repeat(81), operator: "equals", value: true },
    ]);

    expect(() => parseSegmentConditions(conditions)).toThrow(/80/);
  });

  it("rejects excessive conditions", () => {
    const conditions = JSON.stringify(
      Array.from({ length: 51 }, () => ({
        attribute: "country",
        operator: "equals",
        value: "BR",
      })),
    );

    expect(() => parseSegmentConditions(conditions)).toThrow(/50/);
  });
});
