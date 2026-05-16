import { BadRequestException } from "@nestjs/common";
import { isJsonArrayValue, isJsonObjectValue } from "./json-values";

export const featureFlagTypes = [
  "boolean",
  "string",
  "integer",
  "double",
  "json_object",
  "json_array",
] as const;

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

  if (type === "json_object") {
    return {};
  }

  if (type === "json_array") {
    return [];
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

  if (type === "json_object") {
    if (!isJsonObjectValue(value)) {
      throw new BadRequestException("Default value must be a JSON object");
    }

    return value;
  }

  if (type === "json_array") {
    if (!isJsonArrayValue(value)) {
      throw new BadRequestException("Default value must be a JSON array");
    }

    return value;
  }

  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new BadRequestException("Default value must be a finite number");
  }

  return value;
}
