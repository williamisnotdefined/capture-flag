import { describe, expect, it } from "vitest";
import { formatResourceLabel } from "../formatResourceLabel";

describe("formatResourceLabel", () => {
  it("includes the key when present", () => {
    expect(formatResourceLabel({ key: "prod", name: "Production" })).toBe("Production (prod)");
  });

  it("uses only the name when key is missing", () => {
    expect(formatResourceLabel({ name: "Production" })).toBe("Production");
  });
});
