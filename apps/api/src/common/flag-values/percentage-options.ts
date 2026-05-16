import { BadRequestException } from "@nestjs/common";
import { type FeatureFlagType, normalizeFlagDefaultValue } from "./flag-types";
import { normalizeJsonArray } from "./json-values";
import { isFiniteNumber } from "./targeting-operators";

export const maxPercentageOptions = 20;

const percentageUnitsPerPercent = 100;
const percentageUnitTolerance = 1e-9;

export function normalizePercentageOptions(type: FeatureFlagType, value: unknown) {
  const options = normalizeJsonArray(value, "percentageOptionsJson");

  if (options.length > maxPercentageOptions) {
    throw new BadRequestException(`Use at most ${maxPercentageOptions} percentage options`);
  }

  if (options.length === 0) {
    return options;
  }

  let totalPercentageUnits = 0;

  for (const option of options) {
    if (!option || typeof option !== "object" || Array.isArray(option)) {
      throw new BadRequestException("Percentage options must contain objects");
    }

    const record = option as Record<string, unknown>;
    const percentage = record.percentage;
    const percentageUnits = isFiniteNumber(percentage) ? percentageToBucketUnits(percentage) : null;
    if (
      !isFiniteNumber(percentage) ||
      percentage < 0 ||
      percentage > 100 ||
      percentageUnits === null
    ) {
      throw new BadRequestException(
        "Percentage option percentage must be between 0 and 100 with at most two decimals",
      );
    }

    if (!Object.prototype.hasOwnProperty.call(record, "value")) {
      throw new BadRequestException("Percentage option value is required");
    }

    totalPercentageUnits += percentageUnits;
    normalizeFlagDefaultValue(type, record.value);
  }

  if (totalPercentageUnits !== 100 * percentageUnitsPerPercent) {
    throw new BadRequestException("Percentage options must add up to 100");
  }

  return options;
}

export function normalizePercentageAttribute(value: unknown) {
  if (value === undefined) {
    return "identifier";
  }

  if (typeof value !== "string") {
    throw new BadRequestException("percentageAttribute must be a string");
  }

  const percentageAttribute = value.trim();
  if (!percentageAttribute) {
    throw new BadRequestException("percentageAttribute is required");
  }

  if (percentageAttribute.length > 80) {
    throw new BadRequestException("percentageAttribute is too long");
  }

  return percentageAttribute;
}

function percentageToBucketUnits(percentage: number): number | null {
  const scaledPercentage = percentage * percentageUnitsPerPercent;
  const percentageUnits = Math.round(scaledPercentage);

  if (
    !Number.isSafeInteger(percentageUnits) ||
    Math.abs(scaledPercentage - percentageUnits) > percentageUnitTolerance
  ) {
    return null;
  }

  return percentageUnits;
}
