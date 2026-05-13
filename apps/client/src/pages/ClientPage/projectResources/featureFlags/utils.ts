import type { FeatureFlag, FeatureFlagType } from "../../../../types";

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
    if (typeof record.percentage !== "number" || record.percentage < 0) {
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

    totalPercentage += record.percentage;
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
