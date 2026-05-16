import { describe, expect, it } from "vitest";
import { isSemVerValue } from "../isSemVerValue";

describe("isSemVerValue", () => {
  it("accepts valid SemVer values", () => {
    expect(isSemVerValue("1.2.3")).toBe(true);
    expect(isSemVerValue("1.2.3-alpha.1+build.01")).toBe(true);
  });

  it("rejects invalid SemVer values", () => {
    expect(isSemVerValue("1.02.3")).toBe(false);
    expect(isSemVerValue("1.2.3 ")).toBe(false);
    expect(isSemVerValue("1.2.3-01")).toBe(false);
    expect(isSemVerValue("1.2")).toBe(false);
  });
});
