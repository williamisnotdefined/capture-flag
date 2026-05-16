import { describe, expect, it } from "vitest";
import { isValidSemVerCore } from "../isValidSemVerCore";

describe("isValidSemVerCore", () => {
  it("accepts valid three-part SemVer cores", () => {
    expect(isValidSemVerCore("1.2.3")).toBe(true);
    expect(isValidSemVerCore("0.0.0")).toBe(true);
  });

  it("rejects invalid SemVer cores", () => {
    expect(isValidSemVerCore("1.2")).toBe(false);
    expect(isValidSemVerCore("1.02.3")).toBe(false);
    expect(isValidSemVerCore("1.2.x")).toBe(false);
  });
});
