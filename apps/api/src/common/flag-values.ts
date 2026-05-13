import { BadRequestException } from "@nestjs/common";

export const featureFlagTypes = ["boolean", "string", "integer", "double"] as const;

export type FeatureFlagType = (typeof featureFlagTypes)[number];

export function isFeatureFlagType(value: unknown): value is FeatureFlagType {
  return typeof value === "string" && featureFlagTypes.includes(value as FeatureFlagType);
}

export function defaultValueForFlagType(type: FeatureFlagType) {
  if (type === "boolean") {
    return false;
  }

  if (type === "string") {
    return "";
  }

  return 0;
}

export function normalizeFlagDefaultValue(type: FeatureFlagType, value: unknown) {
  if (type === "boolean") {
    if (typeof value !== "boolean") {
      throw new BadRequestException("Default value must be a boolean");
    }

    return value;
  }

  if (type === "string") {
    if (typeof value !== "string") {
      throw new BadRequestException("Default value must be a string");
    }

    return value;
  }

  if (type === "integer") {
    if (typeof value !== "number" || !Number.isInteger(value)) {
      throw new BadRequestException("Default value must be an integer");
    }

    return value;
  }

  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new BadRequestException("Default value must be a finite number");
  }

  return value;
}

export function normalizeJsonArray(value: unknown, fieldName: string) {
  if (value === undefined) {
    return [];
  }

  if (!Array.isArray(value)) {
    throw new BadRequestException(`${fieldName} must be an array`);
  }

  return value;
}

export function normalizePercentageOptions(type: FeatureFlagType, value: unknown) {
  const options = normalizeJsonArray(value, "percentageOptionsJson");

  if (options.length === 0) {
    return options;
  }

  let totalPercentage = 0;

  for (const option of options) {
    if (!option || typeof option !== "object" || Array.isArray(option)) {
      throw new BadRequestException("Percentage options must contain objects");
    }

    const record = option as Record<string, unknown>;
    if (typeof record.percentage !== "number" || record.percentage < 0) {
      throw new BadRequestException("Percentage option percentage must be a positive number");
    }

    if (!Object.prototype.hasOwnProperty.call(record, "value")) {
      throw new BadRequestException("Percentage option value is required");
    }

    totalPercentage += record.percentage;
    normalizeFlagDefaultValue(type, record.value);
  }

  if (Math.abs(totalPercentage - 100) > Number.EPSILON) {
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

export function normalizeTags(value: unknown) {
  if (value === undefined) {
    return [];
  }

  if (!Array.isArray(value)) {
    throw new BadRequestException("tags must be an array");
  }

  const tags = value.map((tag) => {
    if (typeof tag !== "string") {
      throw new BadRequestException("tags must contain only strings");
    }

    return tag.trim();
  });

  const uniqueTags = Array.from(new Set(tags.filter(Boolean)));
  if (uniqueTags.length > 20) {
    throw new BadRequestException("Use at most 20 tags");
  }

  if (uniqueTags.some((tag) => tag.length > 50)) {
    throw new BadRequestException("Each tag must have at most 50 characters");
  }

  return uniqueTags;
}
