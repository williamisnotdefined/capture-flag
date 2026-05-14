import { normalizeConditionValue } from "../src/common/flag-values";

describe("flag value validation", () => {
  it.each([
    ["contains", 123],
    ["startsWith", true],
    ["endsWith", null],
    ["oneOf", "pro"],
    ["greaterThan", "5"],
    ["lessThan", Number.NaN],
    ["semverEquals", "01.0.0"],
    ["semverGreaterThan", "1.0.0-01"],
  ] as const)("rejects invalid %s condition values", (operator, value) => {
    expect(() => normalizeConditionValue(operator, value)).toThrow();
  });
});
