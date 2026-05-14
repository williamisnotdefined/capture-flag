import type { FeatureFlag, FeatureFlagType } from "../../../../types";

const evaluationOperators = [
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

type EvaluationOperator = (typeof evaluationOperators)[number];

const prerequisiteOperators = ["equals", "notEquals"] as const;
const semverOperators = [
  "semverEquals",
  "semverGreaterThan",
  "semverGreaterThanOrEquals",
  "semverLessThan",
  "semverLessThanOrEquals",
] as const;

export function defaultValueForType(type: FeatureFlagType) {
  if (type === "boolean") {
    return "false";
  }

  if (type === "string") {
    return "";
  }

  return "0";
}

export function valueToInput(flag: FeatureFlag | undefined, value: unknown) {
  if (!flag) {
    return "";
  }

  if (value === undefined) {
    return defaultValueForType(flag.type);
  }

  if (flag.type === "boolean") {
    return value === true ? "true" : "false";
  }

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number") {
    return String(value);
  }

  return defaultValueForType(flag.type);
}

export function parseDefaultValue(type: FeatureFlagType, value: string) {
  if (type === "boolean") {
    return value === "true";
  }

  if (type === "string") {
    return value;
  }

  const normalizedValue = value.trim();
  if (!normalizedValue) {
    throw new Error("Informe um numero valido.");
  }

  const numberValue = Number(normalizedValue);
  if (!Number.isFinite(numberValue)) {
    throw new Error("Informe um numero valido.");
  }

  if (type === "integer" && !Number.isInteger(numberValue)) {
    throw new Error("Informe um numero inteiro.");
  }

  return numberValue;
}

function assertValueMatchesType(type: FeatureFlagType, value: unknown) {
  if (type === "boolean") {
    if (typeof value !== "boolean") {
      throw new Error("O valor deve ser booleano.");
    }

    return;
  }

  if (type === "string") {
    if (typeof value !== "string") {
      throw new Error("O valor deve ser string.");
    }

    return;
  }

  if (type === "integer") {
    if (typeof value !== "number" || !Number.isInteger(value)) {
      throw new Error("O valor deve ser inteiro.");
    }

    return;
  }

  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error("O valor deve ser um numero finito.");
  }
}

export function jsonArrayToInput(value: unknown) {
  return JSON.stringify(Array.isArray(value) ? value : [], null, 2);
}

export function parseJsonArray(value: string, fieldLabel: string) {
  const normalizedValue = value.trim();
  if (!normalizedValue) {
    return [];
  }

  try {
    const parsedValue = JSON.parse(normalizedValue);
    if (Array.isArray(parsedValue)) {
      return parsedValue;
    }
  } catch {
    throw new Error(`${fieldLabel} deve ser um JSON valido.`);
  }

  throw new Error(`${fieldLabel} deve ser um array JSON.`);
}

export function parseRules(
  value: string,
  type: FeatureFlagType,
  segmentKeys: string[],
  flags: FeatureFlag[],
  currentFlagKey: string,
  environmentId: string,
) {
  const rules = parseJsonArray(value, "Rules");
  const activeSegmentKeys = new Set(segmentKeys);
  const activePrerequisiteFlagTypes = new Map(flags.map((flag) => [flag.key, flag.type] as const));

  const normalizedRules = rules.map((rule) =>
    normalizeRule(rule, type, activeSegmentKeys, activePrerequisiteFlagTypes, currentFlagKey),
  );
  ensurePrerequisiteGraphHasNoCycle(currentFlagKey, normalizedRules, flags, environmentId);

  return normalizedRules;
}

function normalizeRule(
  rule: unknown,
  type: FeatureFlagType,
  activeSegmentKeys: ReadonlySet<string>,
  activePrerequisiteFlagTypes: ReadonlyMap<string, FeatureFlagType>,
  currentFlagKey: string,
) {
  if (!rule || typeof rule !== "object" || Array.isArray(rule)) {
    throw new Error("Rules deve conter objetos.");
  }

  const record = rule as Record<string, unknown>;
  if (!Array.isArray(record.conditions)) {
    throw new Error("Cada rule precisa de conditions como array.");
  }

  if (!Object.prototype.hasOwnProperty.call(record, "serve")) {
    throw new Error("Cada rule precisa de serve.");
  }

  try {
    assertValueMatchesType(type, record.serve);
  } catch (error) {
    throw new Error(
      error instanceof Error ? `Serve invalido: ${error.message}` : "Serve invalido.",
    );
  }

  return {
    conditions: record.conditions.map((condition) =>
      normalizeRuleCondition(
        condition,
        activeSegmentKeys,
        activePrerequisiteFlagTypes,
        currentFlagKey,
      ),
    ),
    serve: record.serve,
  };
}

function normalizeRuleCondition(
  condition: unknown,
  activeSegmentKeys: ReadonlySet<string>,
  activePrerequisiteFlagTypes: ReadonlyMap<string, FeatureFlagType>,
  currentFlagKey: string,
) {
  if (!condition || typeof condition !== "object" || Array.isArray(condition)) {
    throw new Error("Conditions de rules deve conter objetos.");
  }

  const record = condition as Record<string, unknown>;
  if (Object.prototype.hasOwnProperty.call(record, "segment")) {
    if (Object.keys(record).length !== 1) {
      throw new Error("Condition de segmento deve conter apenas segment.");
    }

    const segment = typeof record.segment === "string" ? record.segment.trim() : "";
    if (!segment || !activeSegmentKeys.has(segment)) {
      throw new Error(`Segmento nao encontrado: ${segment || "<vazio>"}.`);
    }

    return { segment };
  }

  if (Object.prototype.hasOwnProperty.call(record, "prerequisiteFlag")) {
    if (Object.keys(record).length !== 3) {
      throw new Error("Condition de prerequisite deve conter prerequisiteFlag, operator e value.");
    }

    const prerequisiteFlag =
      typeof record.prerequisiteFlag === "string" ? record.prerequisiteFlag.trim() : "";
    if (!prerequisiteFlag) {
      throw new Error("Condition de prerequisite precisa de prerequisiteFlag.");
    }

    if (prerequisiteFlag === currentFlagKey) {
      throw new Error("Flag nao pode depender dela mesma.");
    }

    const prerequisiteFlagType = activePrerequisiteFlagTypes.get(prerequisiteFlag);
    if (!prerequisiteFlagType) {
      throw new Error(`Flag prerequisite nao encontrada: ${prerequisiteFlag}.`);
    }

    if (
      !prerequisiteOperators.includes(record.operator as (typeof prerequisiteOperators)[number])
    ) {
      throw new Error("Prerequisite aceita apenas equals ou notEquals.");
    }

    if (!Object.prototype.hasOwnProperty.call(record, "value")) {
      throw new Error("Condition de prerequisite precisa de value.");
    }

    try {
      assertValueMatchesType(prerequisiteFlagType, record.value);
    } catch (error) {
      throw new Error(
        error instanceof Error
          ? `Valor de prerequisite invalido: ${error.message}`
          : "Valor de prerequisite invalido.",
      );
    }

    return {
      prerequisiteFlag,
      operator: record.operator,
      value: record.value,
    };
  }

  const attribute = typeof record.attribute === "string" ? record.attribute.trim() : "";
  if (!attribute) {
    throw new Error("Cada condition precisa de attribute.");
  }

  if (!evaluationOperators.includes(record.operator as (typeof evaluationOperators)[number])) {
    throw new Error("Cada condition precisa de um operator valido.");
  }

  if (!Object.prototype.hasOwnProperty.call(record, "value")) {
    throw new Error("Cada condition precisa de value.");
  }

  assertConditionValueMatchesOperator(record.operator as EvaluationOperator, record.value);

  return {
    attribute,
    operator: record.operator,
    value: record.value,
  };
}

function ensurePrerequisiteGraphHasNoCycle(
  currentFlagKey: string,
  currentRules: unknown[],
  flags: FeatureFlag[],
  environmentId: string,
) {
  const graph = new Map<string, string[]>();
  for (const flag of flags) {
    graph.set(
      flag.key,
      collectPrerequisiteFlagKeys(
        flag.key === currentFlagKey
          ? currentRules
          : (flag.environmentValues.find((value) => value.environmentId === environmentId)
              ?.rulesJson ?? []),
      ),
    );
  }

  const visited = new Set<string>();
  const path = new Set<string>();
  const hasCycle = (flagKey: string): boolean => {
    if (path.has(flagKey)) {
      return true;
    }

    if (visited.has(flagKey)) {
      return false;
    }

    visited.add(flagKey);
    path.add(flagKey);
    for (const prerequisiteFlagKey of graph.get(flagKey) ?? []) {
      if (graph.has(prerequisiteFlagKey) && hasCycle(prerequisiteFlagKey)) {
        return true;
      }
    }

    path.delete(flagKey);
    return false;
  };

  if (hasCycle(currentFlagKey)) {
    throw new Error("Prerequisite flags nao podem conter ciclos.");
  }
}

function collectPrerequisiteFlagKeys(value: unknown) {
  const rules = Array.isArray(value) ? value : [];
  const keys: string[] = [];

  for (const rule of rules) {
    if (!rule || typeof rule !== "object" || Array.isArray(rule)) {
      continue;
    }

    const conditions = (rule as Record<string, unknown>).conditions;
    if (!Array.isArray(conditions)) {
      continue;
    }

    for (const condition of conditions) {
      if (!condition || typeof condition !== "object" || Array.isArray(condition)) {
        continue;
      }

      const prerequisiteFlag = (condition as Record<string, unknown>).prerequisiteFlag;
      if (typeof prerequisiteFlag === "string" && prerequisiteFlag.trim()) {
        keys.push(prerequisiteFlag.trim());
      }
    }
  }

  return keys;
}

function assertConditionValueMatchesOperator(operator: EvaluationOperator, value: unknown) {
  if ((operator === "equals" || operator === "notEquals") && !isComparableValue(value)) {
    throw new Error("Comparacao de igualdade precisa de value string, numero, booleano ou null.");
  }

  if (
    (operator === "contains" || operator === "startsWith" || operator === "endsWith") &&
    typeof value !== "string"
  ) {
    throw new Error(`${operator} precisa de value string.`);
  }

  if (operator === "oneOf" && (!Array.isArray(value) || !value.every(isComparableValue))) {
    throw new Error("oneOf precisa de array de strings, numeros, booleanos ou null.");
  }

  if ((operator === "greaterThan" || operator === "lessThan") && !isFiniteNumber(value)) {
    throw new Error(`${operator} precisa de value numerico finito.`);
  }

  if (operator === "arrayContains" && !isComparableValue(value)) {
    throw new Error("arrayContains precisa de value string, numero, booleano ou null.");
  }

  if ((operator === "dateBefore" || operator === "dateAfter") && !isDateValue(value)) {
    throw new Error("Comparacao de data precisa de value como data valida ou timestamp.");
  }

  if (isSemVerOperator(operator) && !isSemVerValue(value)) {
    throw new Error("Comparacao SemVer precisa de value SemVer valido.");
  }
}

function isComparableValue(value: unknown) {
  return (
    value === null ||
    typeof value === "boolean" ||
    typeof value === "string" ||
    isFiniteNumber(value)
  );
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isDateValue(value: unknown) {
  if (isFiniteNumber(value)) {
    return true;
  }

  return typeof value === "string" && value.trim() !== "" && Number.isFinite(Date.parse(value));
}

function isSemVerOperator(value: EvaluationOperator): value is (typeof semverOperators)[number] {
  return semverOperators.includes(value as (typeof semverOperators)[number]);
}

function isSemVerValue(value: unknown) {
  if (typeof value !== "string" && typeof value !== "number") {
    return false;
  }

  let normalizedValue = String(value).trim().replace(/^v/i, "");
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
  if (parts.length === 0 || parts.length > 3) {
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

export function parsePercentageOptions(value: string, type: FeatureFlagType) {
  const options = parseJsonArray(value, "Rollout percentual");

  if (options.length === 0) {
    return options;
  }

  let totalPercentage = 0;

  for (const option of options) {
    if (!option || typeof option !== "object" || Array.isArray(option)) {
      throw new Error("Rollout percentual deve conter objetos.");
    }

    const record = option as Record<string, unknown>;
    const percentage = record.percentage;
    if (!isFiniteNumber(percentage) || percentage < 0) {
      throw new Error("Cada percentage deve ser um numero positivo.");
    }

    if (!Object.prototype.hasOwnProperty.call(record, "value")) {
      throw new Error("Cada opcao de rollout deve informar value.");
    }

    try {
      assertValueMatchesType(type, record.value);
    } catch (error) {
      throw new Error(
        error instanceof Error ? `Valor de rollout invalido: ${error.message}` : "Valor invalido.",
      );
    }

    totalPercentage += percentage;
  }

  if (Math.abs(totalPercentage - 100) > Number.EPSILON) {
    throw new Error("Rollout percentual deve somar 100.");
  }

  return options;
}

export function parseTagsInput(value: string) {
  return Array.from(
    new Set(
      value
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
    ),
  );
}
