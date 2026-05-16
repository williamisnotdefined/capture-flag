import { describe, expect, it } from "vitest";
import { parseCommaSeparatedUniqueValues } from "../parseCommaSeparatedUniqueValues";

describe("parseCommaSeparatedUniqueValues", () => {
  it("trims, removes empty values, and de-duplicates while preserving first occurrence order", () => {
    expect(parseCommaSeparatedUniqueValues(" beta, alpha, beta, , gamma ")).toEqual([
      "beta",
      "alpha",
      "gamma",
    ]);
  });
});
