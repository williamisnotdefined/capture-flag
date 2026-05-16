import { BadRequestException } from "@nestjs/common";
import {
  normalizeConditionValue,
  normalizeFlagDefaultValue,
  normalizePercentageOptions,
  normalizeRules,
} from "../src/common/flag-values";

describe("flag value normalization", () => {
  it("accepts JSON object and array roots only for their matching flag types", () => {
    expect(
      normalizeFlagDefaultValue("json_object", {
        enabled: true,
        nested: { count: 1 },
        values: ["beta", null],
      }),
    ).toEqual({ enabled: true, nested: { count: 1 }, values: ["beta", null] });
    expect(normalizeFlagDefaultValue("json_array", [{ enabled: true }, null, 1])).toEqual([
      { enabled: true },
      null,
      1,
    ]);

    expect(() => normalizeFlagDefaultValue("json_object", [])).toThrow(BadRequestException);
    expect(() => normalizeFlagDefaultValue("json_array", {})).toThrow(BadRequestException);
  });

  it("rejects excessive rules and conditions", () => {
    const rules = Array.from({ length: 51 }, () => ({
      conditions: [{ attribute: "country", operator: "equals", value: "BR" }],
      serve: true,
    }));
    const tooManyConditions = [
      {
        conditions: Array.from({ length: 11 }, () => ({
          attribute: "country",
          operator: "equals",
          value: "BR",
        })),
        serve: true,
      },
    ];

    expect(() => normalizeRules("boolean", rules, new Set())).toThrow(BadRequestException);
    expect(() => normalizeRules("boolean", tooManyConditions, new Set())).toThrow(
      BadRequestException,
    );
  });

  it("rejects prerequisite self-references", () => {
    const rules = [
      {
        conditions: [{ prerequisiteFlag: "checkout", operator: "equals", value: true }],
        serve: false,
      },
    ];

    expect(() =>
      normalizeRules("boolean", rules, new Set(), new Map([["checkout", "boolean"]]), "checkout"),
    ).toThrow(BadRequestException);
  });

  it("rejects JSON flag types as prerequisites", () => {
    const objectPrerequisiteRules = [
      {
        conditions: [
          { prerequisiteFlag: "settings", operator: "equals", value: { enabled: true } },
        ],
        serve: true,
      },
    ];
    const arrayPrerequisiteRules = [
      {
        conditions: [{ prerequisiteFlag: "variants", operator: "equals", value: ["a"] }],
        serve: true,
      },
    ];

    expect(() =>
      normalizeRules(
        "boolean",
        objectPrerequisiteRules,
        new Set(),
        new Map([["settings", "json_object"]]),
      ),
    ).toThrow(BadRequestException);
    expect(() =>
      normalizeRules(
        "boolean",
        arrayPrerequisiteRules,
        new Set(),
        new Map([["variants", "json_array"]]),
      ),
    ).toThrow(BadRequestException);
  });

  it("accepts date-only values and date-times with timezones", () => {
    expect(normalizeConditionValue("dateBefore", "2026-05-16")).toBe("2026-05-16");
    expect(normalizeConditionValue("dateAfter", "2026-05-16T12:34:56-03:00")).toBe(
      "2026-05-16T12:34:56-03:00",
    );

    expect(() => normalizeConditionValue("dateAfter", "2026-05-16T12:34:56")).toThrow(
      BadRequestException,
    );
  });

  it("accepts SemVer prerelease and build metadata", () => {
    expect(normalizeConditionValue("semverGreaterThan", "1.2.3-alpha.1+build.7")).toBe(
      "1.2.3-alpha.1+build.7",
    );
    expect(normalizeConditionValue("semverEquals", "1.2.3+001")).toBe("1.2.3+001");

    expect(() => normalizeConditionValue("semverLessThan", "1.2.3-01")).toThrow(
      BadRequestException,
    );
  });

  it("rejects excessive or over-precise percentage options", () => {
    const tooManyOptions = Array.from({ length: 21 }, () => ({ percentage: 0, value: true }));
    const overPrecise = [
      { percentage: 33.333, value: true },
      { percentage: 66.667, value: false },
    ];

    expect(() => normalizePercentageOptions("boolean", tooManyOptions)).toThrow(
      BadRequestException,
    );
    expect(() => normalizePercentageOptions("boolean", overPrecise)).toThrow(BadRequestException);
  });

  it("allows percentage options with at most two decimals", () => {
    const options = [
      { percentage: 33.33, value: true },
      { percentage: 66.67, value: false },
    ];

    expect(normalizePercentageOptions("boolean", options)).toEqual(options);
  });

  it("requires percentage options to add up to 100", () => {
    expect(
      normalizePercentageOptions("boolean", [
        { percentage: 40, value: true },
        { percentage: 60, value: false },
      ]),
    ).toEqual([
      { percentage: 40, value: true },
      { percentage: 60, value: false },
    ]);

    expect(() =>
      normalizePercentageOptions("boolean", [
        { percentage: 50, value: true },
        { percentage: 49.99, value: false },
      ]),
    ).toThrow(BadRequestException);
  });
});
