import { isJsonValue } from "./isJsonValue";
import { isRecord } from "./isRecord";

export function isJsonObjectValue(value: unknown): value is Record<string, unknown> {
  return isRecord(value) && Object.values(value).every(isJsonValue);
}
