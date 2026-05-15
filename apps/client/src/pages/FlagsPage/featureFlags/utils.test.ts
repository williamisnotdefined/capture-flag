import { describe, expect, it } from "vitest";
import type { FeatureFlag } from "../../../types";
import { parsePercentageOptions, parseRules, valueToInput } from "./utils";

describe("feature flag rule parsing", () => {
  it("formats JSON initial defaults for missing environment values", () => {
    const flag = {
      initialDefaultValue: { layout: { density: "compact" }, theme: "dark" },
      type: "json_object",
    } as FeatureFlag;

    expect(valueToInput(flag, flag.initialDefaultValue)).toBe(
      JSON.stringify({ layout: { density: "compact" }, theme: "dark" }, null, 2),
    );
  });

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

  it("rejects excessive rules and conditions", () => {
    const rules = JSON.stringify(
      Array.from({ length: 51 }, () => ({
        conditions: [{ attribute: "country", operator: "equals", value: "BR" }],
        serve: true,
      })),
    );
    const tooManyConditions = JSON.stringify([
      {
        conditions: Array.from({ length: 11 }, () => ({
          attribute: "country",
          operator: "equals",
          value: "BR",
        })),
        serve: true,
      },
    ]);

    expect(() => parseRules(rules, "boolean", [], [], "newCheckout", "production")).toThrow(/50/);
    expect(() =>
      parseRules(tooManyConditions, "boolean", [], [], "newCheckout", "production"),
    ).toThrow(/10/);
  });

  it("rejects excessive or over-precise percentage options", () => {
    const tooManyOptions = JSON.stringify(
      Array.from({ length: 21 }, () => ({ percentage: 100 / 21, value: true })),
    );
    const overPrecise = JSON.stringify([
      { percentage: 33.333, value: true },
      { percentage: 66.667, value: false },
    ]);

    expect(() => parsePercentageOptions(tooManyOptions, "boolean")).toThrow(/20/);
    expect(() => parsePercentageOptions(overPrecise, "boolean")).toThrow(/duas casas/);
  });
});
