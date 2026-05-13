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
