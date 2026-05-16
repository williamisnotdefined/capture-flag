import { BadRequestException } from "@nestjs/common";
import { type FeatureFlagType, normalizeFlagDefaultValue } from "./flag-types";
import { isRecord, normalizeJsonArray, normalizeJsonArrayOrEmpty } from "./json-values";
import { isEvaluationOperator, normalizeConditionValue } from "./targeting-operators";

export const maxRulesPerFlag = 50;
export const maxConditionsPerRule = 10;
export const maxSegmentConditions = 50;

const segmentReferenceKeyPattern = /^[A-Za-z][A-Za-z0-9_.-]*$/;
const prerequisiteFlagKeyPattern = /^[A-Za-z][A-Za-z0-9_.-]*$/;
const prerequisiteOperators = ["equals", "notEquals"] as const;

export function normalizeRules(
  type: FeatureFlagType,
  value: unknown,
  activeSegmentKeys: ReadonlySet<string>,
  activePrerequisiteFlagTypes: ReadonlyMap<string, FeatureFlagType> = new Map(),
  currentFlagKey?: string,
) {
  const rules = normalizeJsonArray(value, "rulesJson");
  if (rules.length > maxRulesPerFlag) {
    throw new BadRequestException(`Use at most ${maxRulesPerFlag} rules`);
  }

  return rules.map((rule) =>
    normalizeRule(type, rule, activeSegmentKeys, activePrerequisiteFlagTypes, currentFlagKey),
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

export function rulesJsonReferencesPrerequisiteFlag(value: unknown, flagKey: string) {
  return normalizeJsonArrayOrEmpty(value).some((rule) => {
    if (!isRecord(rule) || !Array.isArray(rule.conditions)) {
      return false;
    }

    return rule.conditions.some(
      (condition) => isRecord(condition) && condition.prerequisiteFlag === flagKey,
    );
  });
}

function normalizeRule(
  type: FeatureFlagType,
  rule: unknown,
  activeSegmentKeys: ReadonlySet<string>,
  activePrerequisiteFlagTypes: ReadonlyMap<string, FeatureFlagType>,
  currentFlagKey: string | undefined,
) {
  if (!isRecord(rule)) {
    throw new BadRequestException("Rules must contain objects");
  }

  if (!Array.isArray(rule.conditions)) {
    throw new BadRequestException("Rule conditions must be an array");
  }

  if (rule.conditions.length > maxConditionsPerRule) {
    throw new BadRequestException(`Use at most ${maxConditionsPerRule} conditions per rule`);
  }

  if (!Object.prototype.hasOwnProperty.call(rule, "serve") || rule.serve === undefined) {
    throw new BadRequestException("Rule serve value is required");
  }

  return {
    conditions: rule.conditions.map((condition) =>
      normalizeRuleCondition(
        condition,
        activeSegmentKeys,
        activePrerequisiteFlagTypes,
        currentFlagKey,
      ),
    ),
    serve: normalizeFlagDefaultValue(type, rule.serve),
  };
}

function normalizeRuleCondition(
  condition: unknown,
  activeSegmentKeys: ReadonlySet<string>,
  activePrerequisiteFlagTypes: ReadonlyMap<string, FeatureFlagType>,
  currentFlagKey: string | undefined,
) {
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

  if (Object.prototype.hasOwnProperty.call(condition, "prerequisiteFlag")) {
    if (Object.keys(condition).length !== 3) {
      throw new BadRequestException(
        "Prerequisite rule conditions must contain only prerequisiteFlag, operator and value",
      );
    }

    const prerequisiteFlag =
      typeof condition.prerequisiteFlag === "string" ? condition.prerequisiteFlag.trim() : "";
    if (!prerequisiteFlag || !prerequisiteFlagKeyPattern.test(prerequisiteFlag)) {
      throw new BadRequestException("Prerequisite flag reference is invalid");
    }

    if (currentFlagKey && prerequisiteFlag === currentFlagKey) {
      throw new BadRequestException("Prerequisite flag cannot reference itself");
    }

    if (!isPrerequisiteOperator(condition.operator)) {
      throw new BadRequestException("Prerequisite flag operator is invalid");
    }

    if (
      !Object.prototype.hasOwnProperty.call(condition, "value") ||
      condition.value === undefined
    ) {
      throw new BadRequestException("Prerequisite flag value is required");
    }

    const prerequisiteType = activePrerequisiteFlagTypes.get(prerequisiteFlag);
    if (!prerequisiteType) {
      throw new BadRequestException(`Prerequisite flag does not exist: ${prerequisiteFlag}`);
    }

    return {
      prerequisiteFlag,
      operator: condition.operator,
      value: normalizePrerequisiteValue(prerequisiteType, condition.value),
    };
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
    value: normalizeConditionValue(condition.operator, condition.value),
  };
}

function isPrerequisiteOperator(value: unknown): value is (typeof prerequisiteOperators)[number] {
  return (
    typeof value === "string" &&
    prerequisiteOperators.includes(value as (typeof prerequisiteOperators)[number])
  );
}

function normalizePrerequisiteValue(type: FeatureFlagType, value: unknown) {
  if (type === "json_object" || type === "json_array") {
    throw new BadRequestException("Prerequisite flag value must reference a primitive flag type");
  }

  try {
    return normalizeFlagDefaultValue(type, value);
  } catch {
    throw new BadRequestException("Prerequisite flag value must match the referenced flag type");
  }
}
