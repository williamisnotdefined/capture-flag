import { BadRequestException } from "@nestjs/common";

export function normalizeJsonArray(value: unknown, fieldName: string) {
  if (value === undefined) {
    return [];
  }

  if (!Array.isArray(value)) {
    throw new BadRequestException(`${fieldName} must be an array`);
  }

  return value;
}

export function normalizeJsonArrayOrEmpty(value: unknown) {
  return Array.isArray(value) ? value : [];
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isJsonObjectValue(value: unknown): value is Record<string, unknown> {
  return isRecord(value) && Object.values(value).every(isJsonValue);
}

export function isJsonArrayValue(value: unknown): value is unknown[] {
  return Array.isArray(value) && value.every(isJsonValue);
}

export function isJsonValue(value: unknown): boolean {
  if (value === null || typeof value === "boolean" || typeof value === "string") {
    return true;
  }

  if (typeof value === "number") {
    return Number.isFinite(value);
  }

  return isJsonObjectValue(value) || isJsonArrayValue(value);
}
