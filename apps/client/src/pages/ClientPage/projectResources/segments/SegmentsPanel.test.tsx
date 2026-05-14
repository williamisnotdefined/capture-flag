import { describe, expect, it } from "vitest";
import { parseSegmentConditions } from "./SegmentsPanel";

describe("segment condition parsing", () => {
  it("rejects attributes longer than the API limit", () => {
    const conditions = JSON.stringify([
      { attribute: "a".repeat(81), operator: "equals", value: true },
    ]);

    expect(() => parseSegmentConditions(conditions)).toThrow(/80/);
  });
});
