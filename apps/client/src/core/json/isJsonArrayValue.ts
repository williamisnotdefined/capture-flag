import { isJsonValue } from "./isJsonValue";

export function isJsonArrayValue(value: unknown): value is unknown[] {
  return Array.isArray(value) && value.every(isJsonValue);
}
