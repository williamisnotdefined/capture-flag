import { describe, expect, it } from "vitest";
import { isValidSemVerPrerelease } from "../isValidSemVerPrerelease";

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
