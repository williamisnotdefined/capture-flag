import { describe, expect, it } from "vitest";
import { isNonEmptyRecord } from "../isNonEmptyRecord";

describe("isNonEmptyRecord", () => {
  it("accepts records with at least one key", () => {
    expect(isNonEmptyRecord({ value: undefined })).toBe(true);
  });

  it("rejects empty records and non-records", () => {
    expect(isNonEmptyRecord({})).toBe(false);
    expect(isNonEmptyRecord([])).toBe(false);
    expect(isNonEmptyRecord(null)).toBe(false);
  });
});
