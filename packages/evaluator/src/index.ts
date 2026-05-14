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

export const featureFlagTypes = ["boolean", "string", "integer", "double"] as const;

export type EvaluationOperator = (typeof evaluationOperators)[number];
export type FeatureFlagType = (typeof featureFlagTypes)[number];

export type EvaluationContext = {
  identifier?: string;
  email?: string;
  country?: string;
  custom?: Record<string, unknown>;
};

export type EvaluationCondition = {
  attribute: string;
  operator: EvaluationOperator;
  value: unknown;
};

export type EvaluationRule<TValue = unknown> = {
  conditions: EvaluationCondition[];
  serve: TValue;
};

export type PercentageOption<TValue = unknown> = {
  percentage: number;
  value: TValue;
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
    };

type SemVer = {
  major: number;
  minor: number;
  patch: number;
};

type ComparableValue = boolean | number | string | null;

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

    const flag = rawFlag as CaptureFlagConfigFlag<TValue>;
    if (!isValueForFlagType(flag.type, flag.defaultValue)) {
      return fallbackValue;
    }

    if (!isValueForFlagType(flag.type, fallbackValue)) {
      return fallbackValue;
    }

    const context = input.context ?? {};
    const ruleMatch = evaluateRules(flag.rules, context);
    if (ruleMatch.matched) {
      return valueOrFallback(flag.type, ruleMatch.value, fallbackValue);
    }

    const percentageMatch = evaluatePercentageOptions(input.flagKey, flag, context);
    if (percentageMatch.matched) {
      return valueOrFallback(flag.type, percentageMatch.value, fallbackValue);
    }

    return valueOrFallback(flag.type, flag.defaultValue, fallbackValue);
  } catch {
    return fallbackValue;
  }
}

function evaluateRules<TValue>(
  rules: EvaluationRule<TValue>[],
  context: EvaluationContext,
): EvaluationMatch<TValue> {
  for (const rule of rules as unknown[]) {
    if (!isRecord(rule) || !Array.isArray(rule.conditions) || !hasOwn(rule, "serve")) {
      continue;
    }

    if (rule.conditions.every((condition) => conditionMatches(condition, context))) {
      return {
        matched: true,
        value: rule.serve as TValue,
      };
    }
  }

  return { matched: false };
}

function conditionMatches(condition: unknown, context: EvaluationContext): boolean {
  if (!isRecord(condition)) {
    return false;
  }

  const { attribute, operator, value } = condition;
  if (typeof attribute !== "string" || !isEvaluationOperator(operator)) {
    return false;
  }

  const actualValue = resolveAttribute(context, attribute);
  if (actualValue === undefined) {
    return false;
  }

  if (operator === "equals") {
    return isComparableValue(actualValue) && isComparableValue(value) && actualValue === value;
  }

  if (operator === "notEquals") {
    return isComparableValue(actualValue) && isComparableValue(value) && actualValue !== value;
  }

  if (operator === "contains") {
    return (
      typeof actualValue === "string" && typeof value === "string" && actualValue.includes(value)
    );
  }

  if (operator === "startsWith") {
    return (
      typeof actualValue === "string" && typeof value === "string" && actualValue.startsWith(value)
    );
  }

  if (operator === "endsWith") {
    return (
      typeof actualValue === "string" && typeof value === "string" && actualValue.endsWith(value)
    );
  }

  if (operator === "oneOf") {
    return (
      isComparableValue(actualValue) &&
      Array.isArray(value) &&
      value.some((option) => isComparableValue(option) && option === actualValue)
    );
  }

  if (operator === "greaterThan") {
    return isFiniteNumber(actualValue) && isFiniteNumber(value) && actualValue > value;
  }

  if (operator === "lessThan") {
    return isFiniteNumber(actualValue) && isFiniteNumber(value) && actualValue < value;
  }

  if (operator === "semverGreaterThanOrEquals") {
    return compareSemVerValues(actualValue, value) >= 0;
  }

  return compareSemVerValues(actualValue, value) < 0;
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

  return leftVersion.patch - rightVersion.patch;
}

function parseSemVer(value: unknown): SemVer | null {
  if (typeof value !== "string" && typeof value !== "number") {
    return null;
  }

  const normalizedValue = String(value).trim().replace(/^v/i, "");
  const [versionCore] = normalizedValue.split(/[+-]/);
  if (!versionCore) {
    return null;
  }

  const parts = versionCore.split(".");
  if (parts.length === 0 || parts.length > 3) {
    return null;
  }

  const numbers = parts.map((part) => {
    if (!/^\d+$/.test(part)) {
      return null;
    }

    return Number(part);
  });

  if (numbers.some((part) => part === null)) {
    return null;
  }

  return {
    major: numbers[0] ?? 0,
    minor: numbers[1] ?? 0,
    patch: numbers[2] ?? 0,
  };
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
