import { isValidSemVerPrerelease } from "@core/validation/isValidSemVerPrerelease";
import { describe, expect, it } from "vitest";

describe("isValidSemVerPrerelease", () => {
  it("accepts missing or valid prerelease values", () => {
    expect(isValidSemVerPrerelease(undefined)).toBe(true);
    expect(isValidSemVerPrerelease("alpha.1")).toBe(true);
  });

  it("rejects invalid prerelease values", () => {
    expect(isValidSemVerPrerelease("")).toBe(false);
    expect(isValidSemVerPrerelease("01")).toBe(false);
  });
});
