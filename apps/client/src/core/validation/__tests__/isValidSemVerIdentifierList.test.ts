import { isValidSemVerIdentifierList } from "@core/validation/isValidSemVerIdentifierList";
import { describe, expect, it } from "vitest";

describe("isValidSemVerIdentifierList", () => {
  it("accepts valid identifier lists", () => {
    expect(isValidSemVerIdentifierList("alpha.1", false)).toBe(true);
    expect(isValidSemVerIdentifierList("build.01", true)).toBe(true);
  });

  it("rejects invalid identifier lists", () => {
    expect(isValidSemVerIdentifierList("", false)).toBe(false);
    expect(isValidSemVerIdentifierList("alpha..1", false)).toBe(false);
    expect(isValidSemVerIdentifierList("01", false)).toBe(false);
  });
});
