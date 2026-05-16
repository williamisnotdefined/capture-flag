import type { FeatureFlag, FeatureFlagType } from "@src/types";
import { storyBooleanFlagValue, storyFeatureFlags } from "@stories/mockData";
import { describe, expect, it } from "vitest";
import {
  defaultValueForType,
  getFeatureFlagEnvironmentValue,
  getFeatureFlagOperationalState,
  parseDefaultValue,
  parsePercentageOptions,
  parseRules,
  valueToInput,
} from "../utils";

const flagBase: FeatureFlag = {
  configId: "cfg_default",
  deletedAt: null,
  description: null,
  environmentValues: [],
  hint: null,
  id: "flag_base",
  initialDefaultValue: null,
  key: "baseFlag",
  name: "Base flag",
  owner: null,
  ownerUserId: null,
  projectId: "project_console",
  tags: [],
  type: "boolean",
};

function typedFlag(type: FeatureFlagType, key = `${type}Flag`): FeatureFlag {
  return { ...flagBase, id: key, key, type };
}

function ruleWithCondition(condition: unknown, serve: unknown = true) {
  return JSON.stringify([{ conditions: [condition], serve }]);
}

describe("feature flag rule parsing", () => {
  it("returns defaults and operational states", () => {
    expect(defaultValueForType("boolean")).toBe("false");
    expect(defaultValueForType("string")).toBe("");
    expect(defaultValueForType("json_object")).toBe("{}");
    expect(defaultValueForType("json_array")).toBe("[]");
    expect(defaultValueForType("integer")).toBe("0");
    expect(defaultValueForType("double")).toBe("0");

    expect(getFeatureFlagEnvironmentValue(storyFeatureFlags[0], "env_prod")).toEqual(
      storyBooleanFlagValue,
    );
    expect(getFeatureFlagOperationalState(storyFeatureFlags[0], "missing_env")).toBe("missing");
    expect(getFeatureFlagOperationalState(storyFeatureFlags[0], "env_prod")).toBe("rules");
    expect(
      getFeatureFlagOperationalState(
        {
          ...storyFeatureFlags[0],
          environmentValues: [
            { ...storyBooleanFlagValue, rulesJson: [], percentageOptionsJson: [] },
          ],
        },
        "env_prod",
      ),
    ).toBe("default");
    expect(
      getFeatureFlagOperationalState(
        {
          ...storyFeatureFlags[0],
          environmentValues: [{ ...storyBooleanFlagValue, rulesJson: [] }],
        },
        "env_prod",
      ),
    ).toBe("rollout");
  });

  it("converts values to input strings for all supported flag types", () => {
    expect(valueToInput(undefined, true)).toBe("");
    expect(valueToInput(typedFlag("boolean"), true)).toBe("true");
    expect(valueToInput(typedFlag("boolean"), false)).toBe("false");
    expect(valueToInput(typedFlag("string"), "compact")).toBe("compact");
    expect(valueToInput(typedFlag("integer"), 42)).toBe("42");
    expect(valueToInput(typedFlag("integer"), { invalid: true })).toBe("0");
    expect(valueToInput(typedFlag("json_object"), { limit: 5 })).toBe(
      JSON.stringify({ limit: 5 }, null, 2),
    );
    expect(valueToInput(typedFlag("json_object"), [])).toBe("{}");
    expect(valueToInput(typedFlag("json_array"), ["beta"])).toBe(JSON.stringify(["beta"], null, 2));
    expect(valueToInput(typedFlag("json_array"), {})).toBe("[]");
    expect(valueToInput(typedFlag("double"), undefined)).toBe("0");
  });

  it("parses default values and rejects type mismatches", () => {
    expect(parseDefaultValue("boolean", "true")).toBe(true);
    expect(parseDefaultValue("boolean", "false")).toBe(false);
    expect(parseDefaultValue("string", "compact")).toBe("compact");
    expect(parseDefaultValue("integer", "42")).toBe(42);
    expect(parseDefaultValue("double", "3.14")).toBe(3.14);
    expect(parseDefaultValue("json_object", '{"limit":5}')).toEqual({ limit: 5 });
    expect(parseDefaultValue("json_array", '["beta"]')).toEqual(["beta"]);

    expect(() => parseDefaultValue("integer", "")).toThrow(/numero valido/);
    expect(() => parseDefaultValue("double", "not-number")).toThrow(/numero valido/);
    expect(() => parseDefaultValue("integer", "3.14")).toThrow(/numero inteiro/);
    expect(() => parseDefaultValue("json_object", "")).toThrow(/JSON valido/);
    expect(() => parseDefaultValue("json_object", "{")).toThrow(/JSON valido/);
    expect(() => parseDefaultValue("json_object", "[]")).toThrow(/objeto JSON/);
    expect(() => parseDefaultValue("json_array", "{}")).toThrow(/array JSON/);
  });

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

  it("normalizes valid rules with attributes, segments and prerequisites", () => {
    const flags = [
      { ...typedFlag("boolean"), key: "newCheckout" },
      { ...typedFlag("string"), key: "accountTier" },
    ];
    const rules = JSON.stringify([
      {
        conditions: [
          { segment: "beta-users" },
          { prerequisiteFlag: "accountTier", operator: "equals", value: "pro" },
          { attribute: " country ", operator: "oneOf", value: ["BR", "PT"] },
        ],
        serve: true,
      },
    ]);

    expect(parseRules(rules, "boolean", ["beta-users"], flags, "newCheckout", "env_prod")).toEqual([
      {
        conditions: [
          { segment: "beta-users" },
          { prerequisiteFlag: "accountTier", operator: "equals", value: "pro" },
          { attribute: "country", operator: "oneOf", value: ["BR", "PT"] },
        ],
        serve: true,
      },
    ]);
    expect(parseRules("", "boolean", [], flags, "newCheckout", "env_prod")).toEqual([]);
  });

  it("accepts every attribute operator with valid values", () => {
    const validConditions = [
      { attribute: "role", operator: "equals", value: "admin" },
      { attribute: "role", operator: "notEquals", value: null },
      { attribute: "email", operator: "contains", value: "@example.com" },
      { attribute: "email", operator: "startsWith", value: "ana" },
      { attribute: "email", operator: "endsWith", value: "example.com" },
      { attribute: "country", operator: "oneOf", value: ["BR", "PT"] },
      { attribute: "roles", operator: "arrayContains", value: "admin" },
      { attribute: "age", operator: "greaterThan", value: 18 },
      { attribute: "age", operator: "lessThan", value: 65 },
      { attribute: "createdAt", operator: "dateBefore", value: "2026-05-16" },
      { attribute: "createdAt", operator: "dateAfter", value: 1_779_000_000_000 },
      { attribute: "appVersion", operator: "semverEquals", value: "1.2.3" },
      { attribute: "appVersion", operator: "semverGreaterThan", value: "1.2.3" },
      { attribute: "appVersion", operator: "semverGreaterThanOrEquals", value: "1.2.3" },
      { attribute: "appVersion", operator: "semverLessThan", value: "2.0.0" },
      { attribute: "appVersion", operator: "semverLessThanOrEquals", value: "2.0.0" },
    ];

    for (const condition of validConditions) {
      expect(
        parseRules(ruleWithCondition(condition), "boolean", [], [], "newCheckout", "env_prod"),
      ).toEqual([{ conditions: [condition], serve: true }]);
    }
  });

  it("rejects invalid rule and condition shapes", () => {
    expect(() =>
      parseRules(JSON.stringify([null]), "boolean", [], [], "newCheckout", "env_prod"),
    ).toThrow(/Rules deve conter objetos/);
    expect(() =>
      parseRules(
        JSON.stringify([{ conditions: "bad", serve: true }]),
        "boolean",
        [],
        [],
        "newCheckout",
        "env_prod",
      ),
    ).toThrow(/conditions como array/);
    expect(() =>
      parseRules(
        JSON.stringify([{ conditions: [], noServe: true }]),
        "boolean",
        [],
        [],
        "newCheckout",
        "env_prod",
      ),
    ).toThrow(/precisa de serve/);
    expect(() =>
      parseRules(
        JSON.stringify([{ conditions: [], serve: "true" }]),
        "boolean",
        [],
        [],
        "newCheckout",
        "env_prod",
      ),
    ).toThrow(/Serve invalido/);
    expect(() =>
      parseRules(ruleWithCondition(null), "boolean", [], [], "newCheckout", "env_prod"),
    ).toThrow(/Conditions de rules/);
    expect(() =>
      parseRules(
        ruleWithCondition({ segment: "beta-users", extra: true }),
        "boolean",
        ["beta-users"],
        [],
        "newCheckout",
        "env_prod",
      ),
    ).toThrow(/apenas segment/);
    expect(() =>
      parseRules(
        ruleWithCondition({ segment: "missing" }),
        "boolean",
        ["beta-users"],
        [],
        "newCheckout",
        "env_prod",
      ),
    ).toThrow(/Segmento nao encontrado/);
  });

  it("rejects invalid prerequisite conditions", () => {
    const primitiveFlag = typedFlag("string", "accountTier");
    const jsonFlag = typedFlag("json_object", "tenantLimits");

    expect(() =>
      parseRules(
        ruleWithCondition({
          prerequisiteFlag: "accountTier",
          operator: "equals",
          value: "pro",
          extra: true,
        }),
        "boolean",
        [],
        [primitiveFlag],
        "newCheckout",
        "env_prod",
      ),
    ).toThrow(/prerequisiteFlag, operator e value/);
    expect(() =>
      parseRules(
        ruleWithCondition({ prerequisiteFlag: "", operator: "equals", value: "pro" }),
        "boolean",
        [],
        [primitiveFlag],
        "newCheckout",
        "env_prod",
      ),
    ).toThrow(/precisa de prerequisiteFlag/);
    expect(() =>
      parseRules(
        ruleWithCondition({ prerequisiteFlag: "newCheckout", operator: "equals", value: true }),
        "boolean",
        [],
        [primitiveFlag],
        "newCheckout",
        "env_prod",
      ),
    ).toThrow(/depender dela mesma/);
    expect(() =>
      parseRules(
        ruleWithCondition({ prerequisiteFlag: "missing", operator: "equals", value: true }),
        "boolean",
        [],
        [primitiveFlag],
        "newCheckout",
        "env_prod",
      ),
    ).toThrow(/nao encontrada/);
    expect(() =>
      parseRules(
        ruleWithCondition({ prerequisiteFlag: "tenantLimits", operator: "equals", value: {} }),
        "boolean",
        [],
        [jsonFlag],
        "newCheckout",
        "env_prod",
      ),
    ).toThrow(/primitivas/);
    expect(() =>
      parseRules(
        ruleWithCondition({ prerequisiteFlag: "accountTier", operator: "contains", value: "pro" }),
        "boolean",
        [],
        [primitiveFlag],
        "newCheckout",
        "env_prod",
      ),
    ).toThrow(/equals ou notEquals/);
    expect(() =>
      parseRules(
        ruleWithCondition({ prerequisiteFlag: "accountTier", operator: "equals" }),
        "boolean",
        [],
        [primitiveFlag],
        "newCheckout",
        "env_prod",
      ),
    ).toThrow(/prerequisiteFlag, operator e value/);
    expect(() =>
      parseRules(
        ruleWithCondition({ prerequisiteFlag: "accountTier", operator: "equals", value: 123 }),
        "boolean",
        [],
        [primitiveFlag],
        "newCheckout",
        "env_prod",
      ),
    ).toThrow(/Valor de prerequisite invalido/);
  });

  it("detects prerequisite cycles across existing flag rules", () => {
    const checkoutFlag = { ...typedFlag("boolean", "newCheckout"), environmentValues: [] };
    const accountFlag = {
      ...typedFlag("boolean", "accountEnabled"),
      environmentValues: [
        {
          ...storyBooleanFlagValue,
          featureFlagId: "accountEnabled",
          rulesJson: [
            {
              conditions: [{ prerequisiteFlag: "newCheckout", operator: "equals", value: true }],
              serve: true,
            },
          ],
        },
      ],
    };

    expect(() =>
      parseRules(
        ruleWithCondition({ prerequisiteFlag: "accountEnabled", operator: "equals", value: true }),
        "boolean",
        [],
        [checkoutFlag, accountFlag],
        "newCheckout",
        "env_prod",
      ),
    ).toThrow(/ciclos/);
  });

  it("rejects invalid attribute conditions", () => {
    const invalidConditions = [
      { condition: { attribute: "", operator: "equals", value: true }, message: /attribute/ },
      {
        condition: { attribute: "country", operator: "unknown", value: "BR" },
        message: /operator valido/,
      },
      { condition: { attribute: "country", operator: "equals" }, message: /precisa de value/ },
      { condition: { attribute: "payload", operator: "equals", value: {} }, message: /Comparacao/ },
      { condition: { attribute: "email", operator: "contains", value: 123 }, message: /contains/ },
      {
        condition: { attribute: "country", operator: "oneOf", value: ["BR", {}] },
        message: /oneOf/,
      },
      {
        condition: { attribute: "age", operator: "greaterThan", value: Number.NaN },
        message: /greaterThan/,
      },
      {
        condition: { attribute: "roles", operator: "arrayContains", value: {} },
        message: /arrayContains/,
      },
      {
        condition: { attribute: "createdAt", operator: "dateBefore", value: "bad-date" },
        message: /data/,
      },
      {
        condition: { attribute: "appVersion", operator: "semverEquals", value: "1.0" },
        message: /SemVer/,
      },
    ];

    for (const { condition, message } of invalidConditions) {
      expect(() =>
        parseRules(ruleWithCondition(condition), "boolean", [], [], "newCheckout", "env_prod"),
      ).toThrow(message);
    }
  });

  it("parses valid percentage options and rejects invalid rollout payloads", () => {
    expect(parsePercentageOptions("", "boolean")).toEqual([]);
    expect(
      parsePercentageOptions(JSON.stringify([{ percentage: 100, value: true }]), "boolean"),
    ).toEqual([{ percentage: 100, value: true }]);

    expect(() => parsePercentageOptions(JSON.stringify([null]), "boolean")).toThrow(/objetos/);
    expect(() =>
      parsePercentageOptions(JSON.stringify([{ percentage: -1, value: true }]), "boolean"),
    ).toThrow(/entre 0 e 100/);
    expect(() =>
      parsePercentageOptions(JSON.stringify([{ percentage: 101, value: true }]), "boolean"),
    ).toThrow(/entre 0 e 100/);
    expect(() =>
      parsePercentageOptions(JSON.stringify([{ percentage: "100", value: true }]), "boolean"),
    ).toThrow(/entre 0 e 100/);
    expect(() => parsePercentageOptions(JSON.stringify([{ percentage: 100 }]), "boolean")).toThrow(
      /informar value/,
    );
    expect(() =>
      parsePercentageOptions(JSON.stringify([{ percentage: 100, value: "true" }]), "boolean"),
    ).toThrow(/Valor de rollout invalido/);
    expect(() =>
      parsePercentageOptions(JSON.stringify([{ percentage: 90, value: true }]), "boolean"),
    ).toThrow(/somar 100/);
  });
});
