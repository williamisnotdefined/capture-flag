import { describe, expect, it } from "vitest";
import { parseRules } from "./utils";

describe("feature flag rule parsing", () => {
  it("rejects attributes longer than the API limit", () => {
    const rules = JSON.stringify([
      {
        conditions: [{ attribute: "a".repeat(81), operator: "equals", value: true }],
        serve: true,
      },
    ]);

    expect(() => parseRules(rules, "boolean", [], [], "newCheckout", "production")).toThrow(/80/);
  });

  it("rejects date and semver values with surrounding whitespace", () => {
    const dateRules = JSON.stringify([
      {
        conditions: [
          { attribute: "custom.releaseDate", operator: "dateAfter", value: " 2026-05-12" },
        ],
        serve: true,
      },
    ]);
    const semverRules = JSON.stringify([
      {
        conditions: [{ attribute: "custom.appVersion", operator: "semverEquals", value: "1.0.0 " }],
        serve: true,
      },
    ]);

    expect(() => parseRules(dateRules, "boolean", [], [], "newCheckout", "production")).toThrow();
    expect(() => parseRules(semverRules, "boolean", [], [], "newCheckout", "production")).toThrow();
  });
});
