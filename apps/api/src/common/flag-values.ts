import { BadRequestException } from "@nestjs/common";

export const featureFlagTypes = ["boolean", "string", "integer", "double"] as const;
export const evaluationOperators = [
  "equals",
  "notEquals",
  "contains",
  "startsWith",
  "endsWith",
  "oneOf",
  "greaterThan",
  "lessThan",
  "semverGreaterThanOrEquals",
  "semverLessThan",
] as const;

export type FeatureFlagType = (typeof featureFlagTypes)[number];
export type EvaluationOperator = (typeof evaluationOperators)[number];

const segmentReferenceKeyPattern = /^[A-Za-z][A-Za-z0-9_.-]*$/;

export function isFeatureFlagType(value: unknown): value is FeatureFlagType {
  return typeof value === "string" && featureFlagTypes.includes(value as FeatureFlagType);
}

export function isEvaluationOperator(value: unknown): value is EvaluationOperator {
  return typeof value === "string" && evaluationOperators.includes(value as EvaluationOperator);
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

export function normalizeRules(
  type: FeatureFlagType,
  value: unknown,
  activeSegmentKeys: ReadonlySet<string>,
) {
  return normalizeJsonArray(value, "rulesJson").map((rule) =>
    normalizeRule(type, rule, activeSegmentKeys),
  );
}

export function rulesJsonReferencesSegment(value: unknown, segmentKey: string) {
  return normalizeJsonArrayOrEmpty(value).some((rule) => {
    if (!isRecord(rule) || !Array.isArray(rule.conditions)) {
      return false;
    }

    return rule.conditions.some(
      (condition) => isRecord(condition) && condition.segment === segmentKey,
    );
  });
}

function normalizeRule(
  type: FeatureFlagType,
  rule: unknown,
  activeSegmentKeys: ReadonlySet<string>,
) {
  if (!isRecord(rule)) {
    throw new BadRequestException("Rules must contain objects");
  }

  if (!Array.isArray(rule.conditions)) {
    throw new BadRequestException("Rule conditions must be an array");
  }

  if (!Object.prototype.hasOwnProperty.call(rule, "serve") || rule.serve === undefined) {
    throw new BadRequestException("Rule serve value is required");
  }

  return {
    conditions: rule.conditions.map((condition) =>
      normalizeRuleCondition(condition, activeSegmentKeys),
    ),
    serve: normalizeFlagDefaultValue(type, rule.serve),
  };
}

function normalizeRuleCondition(condition: unknown, activeSegmentKeys: ReadonlySet<string>) {
  if (!isRecord(condition)) {
    throw new BadRequestException("Rule conditions must contain objects");
  }

  if (Object.prototype.hasOwnProperty.call(condition, "segment")) {
    if (Object.keys(condition).length !== 1) {
      throw new BadRequestException("Segment rule conditions must contain only segment");
    }

    const segmentKey = typeof condition.segment === "string" ? condition.segment.trim() : "";
    if (!segmentKey || !segmentReferenceKeyPattern.test(segmentKey)) {
      throw new BadRequestException("Segment reference is invalid");
    }

    if (!activeSegmentKeys.has(segmentKey)) {
      throw new BadRequestException(`Segment reference does not exist: ${segmentKey}`);
    }

    return { segment: segmentKey };
  }

  const attribute = typeof condition.attribute === "string" ? condition.attribute.trim() : "";
  if (!attribute) {
    throw new BadRequestException("Rule condition attribute is required");
  }

  if (attribute.length > 80) {
    throw new BadRequestException("Rule condition attribute is too long");
  }

  if (!isEvaluationOperator(condition.operator)) {
    throw new BadRequestException("Rule condition operator is invalid");
  }

  if (!Object.prototype.hasOwnProperty.call(condition, "value") || condition.value === undefined) {
    throw new BadRequestException("Rule condition value is required");
  }

  return {
    attribute,
    operator: condition.operator,
    value: condition.value,
  };
}

function normalizeJsonArrayOrEmpty(value: unknown) {
  return Array.isArray(value) ? value : [];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
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
