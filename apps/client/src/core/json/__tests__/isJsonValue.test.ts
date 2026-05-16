import { isJsonValue } from "@core/json/isJsonValue";
import { describe, expect, it } from "vitest";

describe("isJsonValue", () => {
  it("accepts valid JSON-compatible values", () => {
    expect(isJsonValue(null)).toBe(true);
    expect(isJsonValue(false)).toBe(true);
    expect(isJsonValue("value")).toBe(true);
    expect(isJsonValue(1)).toBe(true);
    expect(isJsonValue({ nested: [true, null, "value"] })).toBe(true);
  });

  it("rejects invalid JSON-compatible values", () => {
    expect(isJsonValue(Number.NaN)).toBe(false);
    expect(isJsonValue(undefined)).toBe(false);
    expect(isJsonValue(() => null)).toBe(false);
  });
});
