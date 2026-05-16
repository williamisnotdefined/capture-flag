import { isJsonObjectValue } from "@core/json/isJsonObjectValue";
import { describe, expect, it } from "vitest";

describe("isJsonObjectValue", () => {
  it("accepts records containing only JSON values", () => {
    expect(isJsonObjectValue({ nested: [true, null, "value"] })).toBe(true);
  });

  it("rejects arrays or records with invalid JSON values", () => {
    expect(isJsonObjectValue(["value"])).toBe(false);
    expect(isJsonObjectValue({ invalid: Number.NaN })).toBe(false);
  });
});
