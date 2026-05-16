import { describe, expect, it } from "vitest";
import { isRecord } from "../isRecord";

describe("isRecord", () => {
  it("accepts plain object-like records", () => {
    expect(isRecord({ value: 1 })).toBe(true);
  });

  it("rejects arrays, null, and primitives", () => {
    expect(isRecord([])).toBe(false);
    expect(isRecord(null)).toBe(false);
    expect(isRecord("value")).toBe(false);
  });
});
