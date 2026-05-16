import { BadRequestException } from "@nestjs/common";

export const evaluationOperators = [
  "equals",
  "notEquals",
  "contains",
  "startsWith",
  "endsWith",
  "oneOf",
  "arrayContains",
  "greaterThan",
  "lessThan",
  "dateBefore",
  "dateAfter",
  "semverEquals",
  "semverGreaterThan",
  "semverGreaterThanOrEquals",
  "semverLessThan",
  "semverLessThanOrEquals",
] as const;

export type EvaluationOperator = (typeof evaluationOperators)[number];

const semverOperators = [
  "semverEquals",
  "semverGreaterThan",
  "semverGreaterThanOrEquals",
  "semverLessThan",
  "semverLessThanOrEquals",
] as const;

export function isEvaluationOperator(value: unknown): value is EvaluationOperator {
  return typeof value === "string" && evaluationOperators.includes(value as EvaluationOperator);
}

export function normalizeConditionValue(operator: EvaluationOperator, value: unknown) {
  if ((operator === "equals" || operator === "notEquals") && !isComparableValue(value)) {
    throw new BadRequestException(
      "Equality comparison value must be a string, number, boolean or null",
    );
  }

  if (
    (operator === "contains" || operator === "startsWith" || operator === "endsWith") &&
    typeof value !== "string"
  ) {
    throw new BadRequestException(`${operator} value must be a string`);
  }

  if (operator === "oneOf" && (!Array.isArray(value) || !value.every(isComparableValue))) {
    throw new BadRequestException(
      "oneOf value must be an array of strings, numbers, booleans or null",
    );
  }

  if ((operator === "greaterThan" || operator === "lessThan") && !isFiniteNumber(value)) {
    throw new BadRequestException(`${operator} value must be a finite number`);
  }

  if (operator === "arrayContains" && !isComparableValue(value)) {
    throw new BadRequestException("arrayContains value must be a string, number, boolean or null");
  }

  if ((operator === "dateBefore" || operator === "dateAfter") && !isDateValue(value)) {
    throw new BadRequestException("Date comparison value must be a valid date string or timestamp");
  }

  if (isSemVerOperator(operator) && !isSemVerValue(value)) {
    throw new BadRequestException("SemVer comparison value must be a valid SemVer string");
  }

  return value;
}

export function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isComparableValue(value: unknown) {
  return (
    value === null ||
    typeof value === "boolean" ||
    typeof value === "string" ||
    isFiniteNumber(value)
  );
}

function isDateValue(value: unknown) {
  if (isFiniteNumber(value)) {
    return true;
  }

  return typeof value === "string" && isIsoDateValue(value);
}

function isSemVerOperator(value: EvaluationOperator): value is (typeof semverOperators)[number] {
  return semverOperators.includes(value as (typeof semverOperators)[number]);
}

function isSemVerValue(value: unknown) {
  if (typeof value !== "string") {
    return false;
  }

  let normalizedValue = value;
  const buildSeparatorIndex = normalizedValue.indexOf("+");
  if (buildSeparatorIndex !== -1) {
    const buildMetadata = normalizedValue.slice(buildSeparatorIndex + 1);
    if (!isValidSemVerIdentifierList(buildMetadata, true)) {
      return false;
    }

    normalizedValue = normalizedValue.slice(0, buildSeparatorIndex);
  }

  if (normalizedValue.includes("+")) {
    return false;
  }

  const prereleaseSeparatorIndex = normalizedValue.indexOf("-");
  const versionCore =
    prereleaseSeparatorIndex === -1
      ? normalizedValue
      : normalizedValue.slice(0, prereleaseSeparatorIndex);
  const prereleaseValue =
    prereleaseSeparatorIndex === -1
      ? undefined
      : normalizedValue.slice(prereleaseSeparatorIndex + 1);

  return isValidSemVerCore(versionCore) && isValidSemVerPrerelease(prereleaseValue);
}

function isValidSemVerCore(value: string) {
  const parts = value.split(".");
  if (parts.length !== 3) {
    return false;
  }

  return parts.every((part) => {
    if (!/^(0|[1-9]\d*)$/.test(part)) {
      return false;
    }

    return Number.isSafeInteger(Number(part));
  });
}

function isValidSemVerPrerelease(value: string | undefined) {
  if (value === undefined) {
    return true;
  }

  return isValidSemVerIdentifierList(value, false);
}

function isValidSemVerIdentifierList(value: string, allowNumericLeadingZeros: boolean) {
  if (!value) {
    return false;
  }

  return value.split(".").every((identifier) => {
    if (!/^[0-9A-Za-z-]+$/.test(identifier)) {
      return false;
    }

    if (!allowNumericLeadingZeros && /^\d+$/.test(identifier)) {
      return /^(0|[1-9]\d*)$/.test(identifier) && Number.isSafeInteger(Number(identifier));
    }

    return true;
  });
}

function isIsoDateValue(value: string) {
  const dateOnlyMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (dateOnlyMatch) {
    return isValidDateParts(dateOnlyMatch[1], dateOnlyMatch[2], dateOnlyMatch[3]);
  }

  const dateTimeMatch =
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.exec(value);
  if (!dateTimeMatch) {
    return false;
  }

  return (
    isValidDateParts(dateTimeMatch[1], dateTimeMatch[2], dateTimeMatch[3]) &&
    Number(dateTimeMatch[4]) <= 23 &&
    Number(dateTimeMatch[5]) <= 59 &&
    Number(dateTimeMatch[6]) <= 59 &&
    Number.isFinite(Date.parse(value))
  );
}

function isValidDateParts(year: string, month: string, day: string) {
  const yearValue = Number(year);
  const monthValue = Number(month);
  const dayValue = Number(day);
  if (monthValue < 1 || monthValue > 12 || dayValue < 1) {
    return false;
  }

  return dayValue <= new Date(Date.UTC(yearValue, monthValue, 0)).getUTCDate();
}
