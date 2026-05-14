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

export const featureFlagTypes = ["boolean", "string", "integer", "double"] as const;

export type EvaluationOperator = (typeof evaluationOperators)[number];
export type FeatureFlagType = (typeof featureFlagTypes)[number];

export type EvaluationContext = {
  identifier?: string;
  email?: string;
  country?: string;
  custom?: Record<string, unknown>;
};

export type AttributeEvaluationCondition = {
  attribute: string;
  operator: EvaluationOperator;
  value: unknown;
};

export type SegmentEvaluationCondition = {
  segment: string;
};

export type PrerequisiteEvaluationCondition = {
  prerequisiteFlag: string;
  operator: "equals" | "notEquals";
  value: unknown;
};

export type EvaluationCondition =
  | AttributeEvaluationCondition
  | SegmentEvaluationCondition
  | PrerequisiteEvaluationCondition;

export type EvaluationRule<TValue = unknown> = {
  conditions: EvaluationCondition[];
  serve: TValue;
};

export type PercentageOption<TValue = unknown> = {
  percentage: number;
  value: TValue;
};

export type EvaluationSegment = {
  conditions: AttributeEvaluationCondition[];
};

export type CaptureFlagConfigFlag<TValue = unknown> = {
  type: FeatureFlagType;
  defaultValue: TValue;
  rules: EvaluationRule<TValue>[];
  percentageAttribute: string;
  percentageOptions: PercentageOption<TValue>[];
};

export type CaptureFlagConfig = {
  schemaVersion: 1;
  projectKey: string;
  configKey: string;
  environment: string;
  revision: number;
  generatedAt: string;
  segments?: Record<string, EvaluationSegment>;
  flags: Record<string, CaptureFlagConfigFlag>;
};

export type EvaluateInput<TValue> = {
  config: CaptureFlagConfig | null | undefined;
  flagKey: string;
  fallbackValue: TValue;
  context?: EvaluationContext | null;
};

type EvaluationMatch<TValue> =
  | {
      matched: true;
      value: TValue;
    }
  | {
      matched: false;
      blockedByCycle?: boolean;
    };

type ConditionMatch = {
  matched: boolean;
  blockedByCycle?: boolean;
};

type SemVer = {
  major: number;
  minor: number;
  patch: number;
  prerelease: SemVerPrereleaseIdentifier[];
};

type SemVerPrereleaseIdentifier =
  | {
      numeric: true;
      value: number;
    }
  | {
      numeric: false;
      value: string;
    };

type ComparableValue = boolean | number | string | null;

type ResolvedFlagValue =
  | {
      resolved: true;
      type: FeatureFlagType;
      value: unknown;
    }
  | {
      resolved: false;
      blockedByCycle?: boolean;
    };

export function evaluate<TValue>(input: EvaluateInput<TValue>): TValue {
  const { fallbackValue } = input;

  try {
    const config = input.config;
    if (!isRecord(config) || config.schemaVersion !== 1 || !isRecord(config.flags)) {
      return fallbackValue;
    }

    const rawFlag = config.flags[input.flagKey];
    if (!isConfigFlag(rawFlag)) {
      return fallbackValue;
    }

    const flag = rawFlag as CaptureFlagConfigFlag;
    if (!isValueForFlagType(flag.type, flag.defaultValue)) {
      return fallbackValue;
    }

    if (!isValueForFlagType(flag.type, fallbackValue)) {
      return fallbackValue;
    }

    const context = input.context ?? {};
    const segments = isRecord(config.segments) ? config.segments : {};
    const resolvedValue = evaluateFlag(config, input.flagKey, context, segments, new Set(), false);
    if (!resolvedValue.resolved) {
      return fallbackValue;
    }

    return valueOrFallback(flag.type, resolvedValue.value, fallbackValue);
  } catch {
    return fallbackValue;
  }
}

function evaluateFlag(
  config: CaptureFlagConfig,
  flagKey: string,
  context: EvaluationContext,
  segments: Record<string, unknown>,
  flagPath: Set<string>,
  isPrerequisite: boolean,
): ResolvedFlagValue {
  const normalizedFlagKey = flagKey.trim();
  if (!normalizedFlagKey || flagPath.has(normalizedFlagKey)) {
    return { blockedByCycle: flagPath.has(normalizedFlagKey), resolved: false };
  }

  const rawFlag = config.flags[normalizedFlagKey];
  if (!isConfigFlag(rawFlag) || !isValueForFlagType(rawFlag.type, rawFlag.defaultValue)) {
    return { resolved: false };
  }

  flagPath.add(normalizedFlagKey);

  try {
    const flag = rawFlag as CaptureFlagConfigFlag;
    const ruleMatch = evaluateRules(flag.rules, context, config, segments, flagPath);
    if (ruleMatch.matched) {
      return isValueForFlagType(flag.type, ruleMatch.value)
        ? { resolved: true, type: flag.type, value: ruleMatch.value }
        : { resolved: false };
    }

    if (isPrerequisite && ruleMatch.blockedByCycle) {
      return { blockedByCycle: true, resolved: false };
    }

    const percentageMatch = evaluatePercentageOptions(normalizedFlagKey, flag, context);
    if (percentageMatch.matched) {
      return isValueForFlagType(flag.type, percentageMatch.value)
        ? { resolved: true, type: flag.type, value: percentageMatch.value }
        : { resolved: false };
    }

    return { resolved: true, type: flag.type, value: flag.defaultValue };
  } finally {
    flagPath.delete(normalizedFlagKey);
  }
}

function evaluateRules<TValue>(
  rules: EvaluationRule<TValue>[],
  context: EvaluationContext,
  config: CaptureFlagConfig,
  segments: Record<string, unknown>,
  flagPath: Set<string>,
): EvaluationMatch<TValue> {
  let blockedByCycle = false;

  for (const rule of rules as unknown[]) {
    if (!isRecord(rule) || !Array.isArray(rule.conditions) || !hasOwn(rule, "serve")) {
      continue;
    }

    let ruleMatches = true;
    for (const condition of rule.conditions) {
      const conditionMatch = conditionMatches(
        condition,
        context,
        config,
        segments,
        flagPath,
        true,
        true,
      );
      if (!conditionMatch.matched) {
        blockedByCycle ||= conditionMatch.blockedByCycle === true;
        ruleMatches = false;
        break;
      }
    }

    if (ruleMatches) {
      return {
        matched: true,
        value: rule.serve as TValue,
      };
    }
  }

  return { blockedByCycle, matched: false };
}

function conditionMatches(
  condition: unknown,
  context: EvaluationContext,
  config: CaptureFlagConfig,
  segments: Record<string, unknown>,
  flagPath: Set<string>,
  allowSegments: boolean,
  allowPrerequisites: boolean,
): ConditionMatch {
  if (!isRecord(condition)) {
    return { matched: false };
  }

  if (hasOwn(condition, "segment")) {
    return {
      matched:
        allowSegments &&
        Object.keys(condition).length === 1 &&
        segmentMatches(condition.segment, context, config, segments, flagPath),
    };
  }

  if (hasOwn(condition, "prerequisiteFlag")) {
    return allowPrerequisites
      ? prerequisiteMatches(condition, context, config, segments, flagPath)
      : { matched: false };
  }

  const { attribute, operator, value } = condition;
  if (typeof attribute !== "string" || !isEvaluationOperator(operator)) {
    return { matched: false };
  }

  const actualValue = resolveAttribute(context, attribute);
  if (actualValue === undefined) {
    return { matched: false };
  }

  if (operator === "equals") {
    return {
      matched: isComparableValue(actualValue) && isComparableValue(value) && actualValue === value,
    };
  }

  if (operator === "notEquals") {
    return {
      matched: isComparableValue(actualValue) && isComparableValue(value) && actualValue !== value,
    };
  }

  if (operator === "contains") {
    return {
      matched:
        typeof actualValue === "string" && typeof value === "string" && actualValue.includes(value),
    };
  }

  if (operator === "startsWith") {
    return {
      matched:
        typeof actualValue === "string" &&
        typeof value === "string" &&
        actualValue.startsWith(value),
    };
  }

  if (operator === "endsWith") {
    return {
      matched:
        typeof actualValue === "string" && typeof value === "string" && actualValue.endsWith(value),
    };
  }

  if (operator === "oneOf") {
    return {
      matched:
        isComparableValue(actualValue) &&
        Array.isArray(value) &&
        value.some((option) => isComparableValue(option) && option === actualValue),
    };
  }

  if (operator === "arrayContains") {
    return {
      matched:
        Array.isArray(actualValue) &&
        isComparableValue(value) &&
        actualValue.some((option) => isComparableValue(option) && option === value),
    };
  }

  if (operator === "greaterThan") {
    return { matched: isFiniteNumber(actualValue) && isFiniteNumber(value) && actualValue > value };
  }

  if (operator === "lessThan") {
    return { matched: isFiniteNumber(actualValue) && isFiniteNumber(value) && actualValue < value };
  }

  if (operator === "dateBefore") {
    return { matched: compareDateValues(actualValue, value) < 0 };
  }

  if (operator === "dateAfter") {
    return { matched: compareDateValues(actualValue, value) > 0 };
  }

  if (operator === "semverEquals") {
    return { matched: compareSemVerValues(actualValue, value) === 0 };
  }

  if (operator === "semverGreaterThan") {
    return { matched: compareSemVerValues(actualValue, value) > 0 };
  }

  if (operator === "semverGreaterThanOrEquals") {
    return { matched: compareSemVerValues(actualValue, value) >= 0 };
  }

  if (operator === "semverLessThan") {
    return { matched: compareSemVerValues(actualValue, value) < 0 };
  }

  return { matched: compareSemVerValues(actualValue, value) <= 0 };
}

function prerequisiteMatches(
  condition: Record<string, unknown>,
  context: EvaluationContext,
  config: CaptureFlagConfig,
  segments: Record<string, unknown>,
  flagPath: Set<string>,
): ConditionMatch {
  if (
    Object.keys(condition).length !== 3 ||
    hasOwn(condition, "segment") ||
    hasOwn(condition, "attribute")
  ) {
    return { matched: false };
  }

  const prerequisiteFlagKey =
    typeof condition.prerequisiteFlag === "string" ? condition.prerequisiteFlag.trim() : "";
  if (!prerequisiteFlagKey || !isPrerequisiteOperator(condition.operator)) {
    return { matched: false };
  }

  if (flagPath.has(prerequisiteFlagKey)) {
    return { blockedByCycle: true, matched: false };
  }

  const prerequisite = evaluateFlag(config, prerequisiteFlagKey, context, segments, flagPath, true);
  if (!prerequisite.resolved) {
    return { blockedByCycle: prerequisite.blockedByCycle, matched: false };
  }

  if (!isValueForFlagType(prerequisite.type, condition.value)) {
    return { matched: false };
  }

  if (condition.operator === "equals") {
    return { matched: prerequisite.value === condition.value };
  }

  return { matched: prerequisite.value !== condition.value };
}

function segmentMatches(
  segmentKey: unknown,
  context: EvaluationContext,
  config: CaptureFlagConfig,
  segments: Record<string, unknown>,
  flagPath: Set<string>,
): boolean {
  if (typeof segmentKey !== "string") {
    return false;
  }

  const segment = segments[segmentKey.trim()];
  if (!isRecord(segment) || !Array.isArray(segment.conditions) || segment.conditions.length === 0) {
    return false;
  }

  return segment.conditions.every(
    (condition) =>
      conditionMatches(condition, context, config, segments, flagPath, false, false).matched,
  );
}

function evaluatePercentageOptions<TValue>(
  flagKey: string,
  flag: CaptureFlagConfigFlag<TValue>,
  context: EvaluationContext,
): EvaluationMatch<TValue> {
  if (flag.percentageOptions.length === 0) {
    return { matched: false };
  }

  const percentageOptions = normalizePercentageOptions(flag.type, flag.percentageOptions);
  if (!percentageOptions) {
    throw new Error("Invalid percentage options");
  }

  const percentageAttribute = flag.percentageAttribute.trim() || "identifier";
  const attributeValue = resolveAttribute(context, percentageAttribute);
  if (!isRolloutAttributeValue(attributeValue)) {
    return { matched: false };
  }

  const bucket = getPercentageBucket(flagKey, String(attributeValue));
  let cumulativePercentage = 0;

  for (const option of percentageOptions) {
    const upperBound = cumulativePercentage + option.percentage;
    if (bucket < upperBound) {
      return {
        matched: true,
        value: option.value,
      };
    }

    cumulativePercentage = upperBound;
  }

  return { matched: false };
}

function normalizePercentageOptions<TValue>(
  type: FeatureFlagType,
  options: PercentageOption<TValue>[],
): PercentageOption<TValue>[] | null {
  const normalizedOptions: PercentageOption<TValue>[] = [];
  let totalPercentage = 0;

  for (const option of options as unknown[]) {
    if (!isRecord(option) || !hasOwn(option, "value") || !isFiniteNumber(option.percentage)) {
      return null;
    }

    if (option.percentage < 0 || option.percentage > 100) {
      return null;
    }

    if (!isValueForFlagType(type, option.value)) {
      return null;
    }

    totalPercentage += option.percentage;
    if (totalPercentage - 100 > Number.EPSILON) {
      return null;
    }

    if (option.percentage > 0) {
      normalizedOptions.push({
        percentage: option.percentage,
        value: option.value as TValue,
      });
    }
  }

  if (options.length > 0 && Math.abs(totalPercentage - 100) > Number.EPSILON) {
    return null;
  }

  return normalizedOptions;
}

function valueOrFallback<TValue>(
  type: FeatureFlagType,
  value: unknown,
  fallbackValue: TValue,
): TValue {
  return isValueForFlagType(type, value) ? (value as TValue) : fallbackValue;
}

function resolveAttribute(context: EvaluationContext, attribute: string): unknown {
  const normalizedAttribute = attribute.trim();
  if (!normalizedAttribute) {
    return undefined;
  }

  if (normalizedAttribute === "identifier") {
    return context.identifier;
  }

  if (normalizedAttribute === "email") {
    return context.email;
  }

  if (normalizedAttribute === "country") {
    return context.country;
  }

  if (normalizedAttribute === "custom") {
    return context.custom;
  }

  if (normalizedAttribute.startsWith("custom.")) {
    return resolvePath(context.custom, normalizedAttribute.slice("custom.".length));
  }

  return resolvePath(context.custom, normalizedAttribute);
}

function resolvePath(source: unknown, path: string): unknown {
  if (!isRecord(source)) {
    return undefined;
  }

  let currentValue: unknown = source;
  for (const part of path.split(".")) {
    if (!part || !isRecord(currentValue) || !hasOwn(currentValue, part)) {
      return undefined;
    }

    currentValue = currentValue[part];
  }

  return currentValue;
}

function compareSemVerValues(left: unknown, right: unknown): number {
  const leftVersion = parseSemVer(left);
  const rightVersion = parseSemVer(right);

  if (!leftVersion || !rightVersion) {
    return Number.NaN;
  }

  if (leftVersion.major !== rightVersion.major) {
    return leftVersion.major - rightVersion.major;
  }

  if (leftVersion.minor !== rightVersion.minor) {
    return leftVersion.minor - rightVersion.minor;
  }

  if (leftVersion.patch !== rightVersion.patch) {
    return leftVersion.patch - rightVersion.patch;
  }

  return compareSemVerPrerelease(leftVersion.prerelease, rightVersion.prerelease);
}

function parseSemVer(value: unknown): SemVer | null {
  if (typeof value !== "string" && typeof value !== "number") {
    return null;
  }

  let normalizedValue = String(value).trim().replace(/^v/i, "");
  const buildSeparatorIndex = normalizedValue.indexOf("+");
  if (buildSeparatorIndex !== -1) {
    const buildMetadata = normalizedValue.slice(buildSeparatorIndex + 1);
    if (!isValidSemVerIdentifierList(buildMetadata, true)) {
      return null;
    }

    normalizedValue = normalizedValue.slice(0, buildSeparatorIndex);
  }

  if (normalizedValue.includes("+")) {
    return null;
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
  if (!versionCore) {
    return null;
  }

  const parts = versionCore.split(".");
  if (parts.length === 0 || parts.length > 3) {
    return null;
  }

  const numbers: number[] = [];
  for (const part of parts) {
    if (!/^(0|[1-9]\d*)$/.test(part)) {
      return null;
    }

    const numberValue = Number(part);
    if (!Number.isSafeInteger(numberValue)) {
      return null;
    }

    numbers.push(numberValue);
  }

  const prerelease = parseSemVerPrerelease(prereleaseValue);
  if (!prerelease) {
    return null;
  }

  return {
    major: numbers[0] ?? 0,
    minor: numbers[1] ?? 0,
    patch: numbers[2] ?? 0,
    prerelease,
  };
}

function parseSemVerPrerelease(value: string | undefined): SemVerPrereleaseIdentifier[] | null {
  if (value === undefined) {
    return [];
  }

  if (!isValidSemVerIdentifierList(value, false)) {
    return null;
  }

  const identifiers: SemVerPrereleaseIdentifier[] = [];
  for (const identifier of value.split(".")) {
    if (/^(0|[1-9]\d*)$/.test(identifier)) {
      const numberValue = Number(identifier);
      if (!Number.isSafeInteger(numberValue)) {
        return null;
      }

      identifiers.push({ numeric: true, value: numberValue });
      continue;
    }

    identifiers.push({ numeric: false, value: identifier });
  }

  return identifiers;
}

function compareSemVerPrerelease(
  left: SemVerPrereleaseIdentifier[],
  right: SemVerPrereleaseIdentifier[],
): number {
  if (left.length === 0 && right.length === 0) {
    return 0;
  }

  if (left.length === 0) {
    return 1;
  }

  if (right.length === 0) {
    return -1;
  }

  const maxLength = Math.max(left.length, right.length);
  for (let index = 0; index < maxLength; index += 1) {
    const leftIdentifier = left[index];
    const rightIdentifier = right[index];
    if (!leftIdentifier) {
      return -1;
    }

    if (!rightIdentifier) {
      return 1;
    }

    if (leftIdentifier.numeric && rightIdentifier.numeric) {
      const difference = leftIdentifier.value - rightIdentifier.value;
      if (difference !== 0) {
        return difference;
      }
      continue;
    }

    if (leftIdentifier.numeric !== rightIdentifier.numeric) {
      return leftIdentifier.numeric ? -1 : 1;
    }

    const leftValue = String(leftIdentifier.value);
    const rightValue = String(rightIdentifier.value);
    if (leftValue < rightValue) {
      return -1;
    }

    if (leftValue > rightValue) {
      return 1;
    }
  }

  return 0;
}

function isValidSemVerIdentifierList(value: string, allowNumericLeadingZeros: boolean): boolean {
  if (!value) {
    return false;
  }

  return value.split(".").every((identifier) => {
    if (!/^[0-9A-Za-z-]+$/.test(identifier)) {
      return false;
    }

    return (
      allowNumericLeadingZeros || !/^\d+$/.test(identifier) || /^(0|[1-9]\d*)$/.test(identifier)
    );
  });
}

function compareDateValues(left: unknown, right: unknown): number {
  const leftTimestamp = parseDateValue(left);
  const rightTimestamp = parseDateValue(right);

  if (leftTimestamp === null || rightTimestamp === null) {
    return Number.NaN;
  }

  return leftTimestamp - rightTimestamp;
}

function parseDateValue(value: unknown): number | null {
  if (value instanceof Date) {
    const timestamp = value.getTime();
    return Number.isFinite(timestamp) ? timestamp : null;
  }

  if (isFiniteNumber(value)) {
    return value;
  }

  if (typeof value !== "string" || !value.trim()) {
    return null;
  }

  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : null;
}

function getPercentageBucket(flagKey: string, attributeValue: string): number {
  return hashString(`${flagKey}:${attributeValue}`) % 100;
}

function hashString(value: string): number {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function isConfigFlag(value: unknown): value is CaptureFlagConfigFlag {
  return (
    isRecord(value) &&
    isFeatureFlagType(value.type) &&
    hasOwn(value, "defaultValue") &&
    Array.isArray(value.rules) &&
    typeof value.percentageAttribute === "string" &&
    Array.isArray(value.percentageOptions)
  );
}

function isFeatureFlagType(value: unknown): value is FeatureFlagType {
  return typeof value === "string" && featureFlagTypes.includes(value as FeatureFlagType);
}

function isEvaluationOperator(value: unknown): value is EvaluationOperator {
  return typeof value === "string" && evaluationOperators.includes(value as EvaluationOperator);
}

function isPrerequisiteOperator(
  value: unknown,
): value is PrerequisiteEvaluationCondition["operator"] {
  return value === "equals" || value === "notEquals";
}

function isRolloutAttributeValue(value: unknown): value is boolean | number | string {
  if (typeof value === "string") {
    return value.length > 0;
  }

  return typeof value === "boolean" || isFiniteNumber(value);
}

function isValueForFlagType(type: FeatureFlagType, value: unknown): boolean {
  if (type === "boolean") {
    return typeof value === "boolean";
  }

  if (type === "string") {
    return typeof value === "string";
  }

  if (type === "integer") {
    return isFiniteNumber(value) && Number.isInteger(value);
  }

  return isFiniteNumber(value);
}

function isComparableValue(value: unknown): value is ComparableValue {
  if (value === null || typeof value === "boolean" || typeof value === "string") {
    return true;
  }

  return isFiniteNumber(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasOwn(record: Record<string, unknown>, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(record, key);
}
