import { BadRequestException } from "@nestjs/common";
import { normalizePercentageOptions, normalizeRules } from "../src/common/flag-values";

describe("flag value normalization", () => {
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
});
