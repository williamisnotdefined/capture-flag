import { describe, expect, it } from "vitest";
import {
  type CaptureFlagConfig,
  type CaptureFlagConfigFlag,
  type EvaluationOperator,
  evaluate,
} from "../src";

function createFlag(overrides: Partial<CaptureFlagConfigFlag> = {}): CaptureFlagConfigFlag {
  return {
    defaultValue: false,
    percentageAttribute: "identifier",
    percentageOptions: [],
    rules: [],
    type: "boolean",
    ...overrides,
  };
}

function createConfig(flag: CaptureFlagConfigFlag = createFlag()): CaptureFlagConfig {
  return {
    configKey: "default",
    environment: "production",
    flags: {
      newCheckout: flag,
    },
    generatedAt: "2026-05-12T00:00:00.000Z",
    projectKey: "ecommerce",
    revision: 1,
    schemaVersion: 1,
  };
}

describe("evaluate", () => {
  it("returns fallback for missing or invalid config", () => {
    expect(
      evaluate({
        config: null,
        fallbackValue: "fallback",
        flagKey: "newCheckout",
      }),
    ).toBe("fallback");

    expect(
      evaluate({
        config: { ...createConfig(), schemaVersion: 2 } as unknown as CaptureFlagConfig,
        fallbackValue: "fallback",
        flagKey: "newCheckout",
      }),
    ).toBe("fallback");

    expect(
      evaluate({
        config: createConfig(),
        fallbackValue: true,
        flagKey: "missingFlag",
      }),
    ).toBe(true);
  });

  it("returns the configured default value when no rule or rollout matches", () => {
    expect(
      evaluate({
        config: createConfig(createFlag({ defaultValue: true })),
        fallbackValue: false,
        flagKey: "newCheckout",
      }),
    ).toBe(true);
  });

  it("returns fallback when the configured default value does not match the flag type", () => {
    expect(
      evaluate({
        config: createConfig(createFlag({ defaultValue: "true", type: "boolean" })),
        fallbackValue: false,
        flagKey: "newCheckout",
      }),
    ).toBe(false);
  });

  it("returns fallback when the caller fallback does not match the flag type", () => {
    expect(
      evaluate({
        config: createConfig(createFlag({ defaultValue: true, type: "boolean" })),
        fallbackValue: "fallback",
        flagKey: "newCheckout",
      }),
    ).toBe("fallback");
  });

  it("evaluates rules top-down and returns the first matching serve value", () => {
    const config = createConfig(
      createFlag({
        defaultValue: "default",
        rules: [
          {
            conditions: [{ attribute: "country", operator: "equals", value: "BR" }],
            serve: "first",
          },
          {
            conditions: [{ attribute: "country", operator: "equals", value: "BR" }],
            serve: "second",
          },
        ],
        type: "string",
      }),
    );

    expect(
      evaluate({
        config,
        context: { country: "BR" },
        fallbackValue: "fallback",
        flagKey: "newCheckout",
      }),
    ).toBe("first");
  });

  it("returns fallback when a matching rule serves a value with the wrong type", () => {
    const config = createConfig(
      createFlag({
        defaultValue: "default",
        rules: [
          {
            conditions: [{ attribute: "country", operator: "equals", value: "BR" }],
            serve: 123,
          },
        ],
        type: "string",
      }),
    );

    expect(
      evaluate({
        config,
        context: { country: "BR" },
        fallbackValue: "fallback",
        flagKey: "newCheckout",
      }),
    ).toBe("fallback");
  });

  it("requires all conditions in a rule to match", () => {
    const config = createConfig(
      createFlag({
        defaultValue: false,
        rules: [
          {
            conditions: [
              { attribute: "country", operator: "equals", value: "BR" },
              { attribute: "custom.plan", operator: "equals", value: "pro" },
            ],
            serve: true,
          },
        ],
      }),
    );

    expect(
      evaluate({
        config,
        context: { country: "BR", custom: { plan: "free" } },
        fallbackValue: false,
        flagKey: "newCheckout",
      }),
    ).toBe(false);

    expect(
      evaluate({
        config,
        context: { country: "BR", custom: { plan: "pro" } },
        fallbackValue: false,
        flagKey: "newCheckout",
      }),
    ).toBe(true);
  });

  it("evaluates segment references locally inside rules", () => {
    const config = createConfig(
      createFlag({
        defaultValue: false,
        rules: [
          {
            conditions: [{ segment: "beta-users" }],
            serve: true,
          },
        ],
      }),
    );
    config.segments = {
      "beta-users": {
        conditions: [{ attribute: "email", operator: "endsWith", value: "@example.com" }],
      },
    };

    expect(
      evaluate({
        config,
        context: { email: "user@example.com" },
        fallbackValue: false,
        flagKey: "newCheckout",
      }),
    ).toBe(true);
  });

  it("treats missing or nested segment references as non-matches", () => {
    const config = createConfig(
      createFlag({
        defaultValue: "default",
        rules: [
          {
            conditions: [{ segment: "admins" }],
            serve: "matched",
          },
          {
            conditions: [{ segment: "nested" }],
            serve: "nested",
          },
        ],
        type: "string",
      }),
    );
    config.segments = {
      nested: {
        conditions: [{ segment: "admins" } as never],
      },
    };

    expect(
      evaluate({
        config,
        context: { email: "admin@example.com" },
        fallbackValue: "fallback",
        flagKey: "newCheckout",
      }),
    ).toBe("default");
  });

  it("treats hybrid segment and attribute conditions as non-matches", () => {
    const config = createConfig(
      createFlag({
        defaultValue: false,
        rules: [
          {
            conditions: [
              {
                attribute: "country",
                operator: "equals",
                segment: "beta-users",
                value: "BR",
              } as never,
            ],
            serve: true,
          },
        ],
      }),
    );
    config.segments = {
      "beta-users": {
        conditions: [{ attribute: "email", operator: "endsWith", value: "@example.com" }],
      },
    };

    expect(
      evaluate({
        config,
        context: { country: "BR", email: "user@example.com" },
        fallbackValue: false,
        flagKey: "newCheckout",
      }),
    ).toBe(false);
  });

  it("supports the initial comparator matrix", () => {
    const cases: Array<{
      actual: unknown;
      operator: EvaluationOperator;
      value: unknown;
    }> = [
      { actual: "BR", operator: "equals", value: "BR" },
      { actual: "BR", operator: "notEquals", value: "US" },
      { actual: "hello world", operator: "contains", value: "world" },
      { actual: "checkout", operator: "startsWith", value: "check" },
      { actual: "checkout", operator: "endsWith", value: "out" },
      { actual: "pro", operator: "oneOf", value: ["free", "pro"] },
      { actual: 10, operator: "greaterThan", value: 5 },
      { actual: 3, operator: "lessThan", value: 5 },
      { actual: "v1.2.3", operator: "semverGreaterThanOrEquals", value: "1.2" },
      { actual: "1.9.0", operator: "semverLessThan", value: "2.0.0" },
    ];

    for (const testCase of cases) {
      const config = createConfig(
        createFlag({
          defaultValue: false,
          rules: [
            {
              conditions: [
                { attribute: "custom.value", operator: testCase.operator, value: testCase.value },
              ],
              serve: true,
            },
          ],
        }),
      );

      expect(
        evaluate({
          config,
          context: { custom: { value: testCase.actual } },
          fallbackValue: false,
          flagKey: "newCheckout",
        }),
      ).toBe(true);
    }
  });

  it("supports advanced array, date, and semver comparators", () => {
    const cases: Array<{
      actual: unknown;
      operator: EvaluationOperator;
      value: unknown;
    }> = [
      { actual: ["beta", "admin"], operator: "arrayContains", value: "beta" },
      { actual: "2026-05-12T00:00:00.000Z", operator: "dateBefore", value: "2026-05-13" },
      { actual: "2026-05-13T00:00:00.000Z", operator: "dateAfter", value: "2026-05-12" },
      { actual: "1.2.3+build.7", operator: "semverEquals", value: "1.2.3" },
      { actual: "1.2.4", operator: "semverGreaterThan", value: "1.2.3" },
      { actual: "1.2.3", operator: "semverLessThanOrEquals", value: "1.2.3" },
    ];

    for (const testCase of cases) {
      const config = createConfig(
        createFlag({
          defaultValue: false,
          rules: [
            {
              conditions: [
                { attribute: "custom.value", operator: testCase.operator, value: testCase.value },
              ],
              serve: true,
            },
          ],
        }),
      );

      expect(
        evaluate({
          config,
          context: { custom: { value: testCase.actual } },
          fallbackValue: false,
          flagKey: "newCheckout",
        }),
      ).toBe(true);
    }
  });

  it("orders semver prerelease identifiers according to SemVer precedence", () => {
    const config = createConfig(
      createFlag({
        defaultValue: false,
        rules: [
          {
            conditions: [
              {
                attribute: "custom.version",
                operator: "semverGreaterThan",
                value: "1.0.0-beta.2",
              },
              {
                attribute: "custom.version",
                operator: "semverLessThan",
                value: "1.0.0",
              },
            ],
            serve: true,
          },
        ],
      }),
    );

    expect(
      evaluate({
        config,
        context: { custom: { version: "1.0.0-beta.11" } },
        fallbackValue: false,
        flagKey: "newCheckout",
      }),
    ).toBe(true);
  });

  it("orders non-numeric semver prerelease identifiers by ASCII lexical order", () => {
    const config = createConfig(
      createFlag({
        defaultValue: false,
        rules: [
          {
            conditions: [
              {
                attribute: "custom.version",
                operator: "semverGreaterThan",
                value: "1.0.0-Alpha",
              },
            ],
            serve: true,
          },
        ],
      }),
    );

    expect(
      evaluate({
        config,
        context: { custom: { version: "1.0.0-alpha" } },
        fallbackValue: false,
        flagKey: "newCheckout",
      }),
    ).toBe(true);
  });

  it("does not match conditions when the attribute is missing", () => {
    const config = createConfig(
      createFlag({
        defaultValue: "default",
        rules: [
          {
            conditions: [{ attribute: "custom.plan", operator: "notEquals", value: "free" }],
            serve: "matched",
          },
        ],
        type: "string",
      }),
    );

    expect(
      evaluate({
        config,
        context: { custom: {} },
        fallbackValue: "fallback",
        flagKey: "newCheckout",
      }),
    ).toBe("default");
  });

  it("supports semver shorthand and ignores build metadata", () => {
    const config = createConfig(
      createFlag({
        defaultValue: false,
        rules: [
          {
            conditions: [
              {
                attribute: "custom.appVersion",
                operator: "semverGreaterThanOrEquals",
                value: "1.2.3",
              },
            ],
            serve: true,
          },
        ],
      }),
    );

    expect(
      evaluate({
        config,
        context: { custom: { appVersion: "v1.2.3+build.7" } },
        fallbackValue: false,
        flagKey: "newCheckout",
      }),
    ).toBe(true);
  });

  it("returns default value when semver values are invalid", () => {
    const config = createConfig(
      createFlag({
        defaultValue: "default",
        rules: [
          {
            conditions: [
              {
                attribute: "custom.appVersion",
                operator: "semverGreaterThanOrEquals",
                value: "1.0.0",
              },
            ],
            serve: "matched",
          },
        ],
        type: "string",
      }),
    );

    expect(
      evaluate({
        config,
        context: { custom: { appVersion: "latest" } },
        fallbackValue: "fallback",
        flagKey: "newCheckout",
      }),
    ).toBe("default");
  });

  it("rejects invalid semver core identifiers with leading zeroes", () => {
    const config = createConfig(
      createFlag({
        defaultValue: "default",
        rules: [
          {
            conditions: [
              {
                attribute: "custom.appVersion",
                operator: "semverEquals",
                value: "1.0.0",
              },
            ],
            serve: "matched",
          },
        ],
        type: "string",
      }),
    );

    expect(
      evaluate({
        config,
        context: { custom: { appVersion: "01.0.0" } },
        fallbackValue: "fallback",
        flagKey: "newCheckout",
      }),
    ).toBe("default");
  });

  it("evaluates prerequisite flags locally before matching a rule", () => {
    const config = createConfig();
    config.flags = {
      accountEnabled: createFlag({ defaultValue: true }),
      newCheckout: createFlag({
        defaultValue: false,
        rules: [
          {
            conditions: [{ prerequisiteFlag: "accountEnabled", operator: "equals", value: true }],
            serve: true,
          },
        ],
      }),
    };

    expect(
      evaluate({
        config,
        fallbackValue: false,
        flagKey: "newCheckout",
      }),
    ).toBe(true);
  });

  it("uses the evaluated prerequisite flag value, including its own rules", () => {
    const config = createConfig();
    config.flags = {
      betaAccount: createFlag({
        defaultValue: false,
        rules: [
          {
            conditions: [{ attribute: "country", operator: "equals", value: "BR" }],
            serve: true,
          },
        ],
      }),
      newCheckout: createFlag({
        defaultValue: false,
        rules: [
          {
            conditions: [{ prerequisiteFlag: "betaAccount", operator: "equals", value: true }],
            serve: true,
          },
        ],
      }),
    };

    expect(
      evaluate({
        config,
        context: { country: "BR" },
        fallbackValue: false,
        flagKey: "newCheckout",
      }),
    ).toBe(true);
  });

  it("treats missing prerequisite flags and prerequisite cycles as non-matches", () => {
    const config = createConfig();
    config.flags = {
      accountEnabled: createFlag({
        defaultValue: true,
        rules: [
          {
            conditions: [{ prerequisiteFlag: "newCheckout", operator: "equals", value: true }],
            serve: false,
          },
        ],
      }),
      newCheckout: createFlag({
        defaultValue: false,
        rules: [
          {
            conditions: [{ prerequisiteFlag: "missingFlag", operator: "equals", value: true }],
            serve: true,
          },
          {
            conditions: [{ prerequisiteFlag: "accountEnabled", operator: "equals", value: false }],
            serve: true,
          },
        ],
      }),
    };

    expect(
      evaluate({
        config,
        fallbackValue: false,
        flagKey: "newCheckout",
      }),
    ).toBe(false);
  });

  it("does not let cyclic prerequisites resolve through default values", () => {
    const config = createConfig();
    config.flags = {
      accountEnabled: createFlag({
        defaultValue: true,
        rules: [
          {
            conditions: [{ prerequisiteFlag: "newCheckout", operator: "equals", value: true }],
            serve: false,
          },
        ],
      }),
      newCheckout: createFlag({
        defaultValue: false,
        rules: [
          {
            conditions: [{ prerequisiteFlag: "accountEnabled", operator: "equals", value: true }],
            serve: true,
          },
        ],
      }),
    };

    expect(
      evaluate({
        config,
        fallbackValue: false,
        flagKey: "newCheckout",
      }),
    ).toBe(false);
  });

  it("evaluates percentage rollout deterministically", () => {
    const bucketOptions = Array.from({ length: 100 }, (_, index) => ({
      percentage: 1,
      value: index,
    }));
    const config = createConfig(
      createFlag({
        defaultValue: -1,
        percentageOptions: bucketOptions,
        type: "integer",
      }),
    );

    expect(
      evaluate({
        config,
        context: { identifier: "user-123" },
        fallbackValue: -1,
        flagKey: "newCheckout",
      }),
    ).toBe(83);
    expect(
      evaluate({
        config,
        context: { identifier: "user-456" },
        fallbackValue: -1,
        flagKey: "newCheckout",
      }),
    ).toBe(80);
  });

  it("returns fallback when percentage options do not total 100", () => {
    const config = createConfig(
      createFlag({
        defaultValue: "default",
        percentageOptions: [{ percentage: 50, value: "rollout" }],
        type: "string",
      }),
    );

    expect(
      evaluate({
        config,
        context: { identifier: "user-123" },
        fallbackValue: "fallback",
        flagKey: "newCheckout",
      }),
    ).toBe("fallback");
  });

  it("returns fallback when a percentage option value has the wrong type", () => {
    const config = createConfig(
      createFlag({
        defaultValue: "default",
        percentageOptions: [{ percentage: 100, value: 123 }],
        type: "string",
      }),
    );

    expect(
      evaluate({
        config,
        context: { identifier: "user-123" },
        fallbackValue: "fallback",
        flagKey: "newCheckout",
      }),
    ).toBe("fallback");
  });

  it("uses custom rollout attributes", () => {
    const config = createConfig(
      createFlag({
        defaultValue: "control",
        percentageAttribute: "email",
        percentageOptions: [
          { percentage: 10, value: "beta" },
          { percentage: 90, value: "control" },
        ],
        type: "string",
      }),
    );

    expect(
      evaluate({
        config,
        context: { email: "beta@example.com" },
        fallbackValue: "fallback",
        flagKey: "newCheckout",
      }),
    ).toBe("beta");
  });

  it("falls back to default value when rollout attribute is missing", () => {
    const config = createConfig(
      createFlag({
        defaultValue: "default",
        percentageAttribute: "email",
        percentageOptions: [{ percentage: 100, value: "rollout" }],
        type: "string",
      }),
    );

    expect(
      evaluate({
        config,
        context: { identifier: "user-123" },
        fallbackValue: "fallback",
        flagKey: "newCheckout",
      }),
    ).toBe("default");
  });

  it("evaluates rules before percentage rollout", () => {
    const config = createConfig(
      createFlag({
        defaultValue: "default",
        percentageOptions: [{ percentage: 100, value: "rollout" }],
        rules: [
          {
            conditions: [{ attribute: "country", operator: "equals", value: "BR" }],
            serve: "rule",
          },
        ],
        type: "string",
      }),
    );

    expect(
      evaluate({
        config,
        context: { country: "BR", identifier: "user-123" },
        fallbackValue: "fallback",
        flagKey: "newCheckout",
      }),
    ).toBe("rule");
  });
});
